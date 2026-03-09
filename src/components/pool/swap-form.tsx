import * as React from 'react'
import { Alert, Text, TextInput, View } from 'react-native'

import { DataTile } from '@/components/ui/data-tile'
import { InputShell } from '@/components/ui/input-shell'
import { PillSelector } from '@/components/ui/pill-selector'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { formatCompactCurrency, formatPercentage, formatTokenAmount } from '@/lib/formatters'
import { estimateSwapPreview } from '@/lib/position-estimator'
import type { MeteoraPool, PriorityLevel } from '@/types/meteora'

const priorityOptions: { hint: string; label: string; value: PriorityLevel }[] = [
  { hint: 'Saver', label: 'Low', value: 'Low' },
  { hint: 'Balanced', label: 'Medium', value: 'Medium' },
  { hint: 'Faster', label: 'High', value: 'High' },
]

function sanitizeDecimal(value: string) {
  const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '')
  const firstDotIndex = cleaned.indexOf('.')

  if (firstDotIndex === -1) {
    return cleaned
  }

  const whole = cleaned.slice(0, firstDotIndex + 1)
  const fraction = cleaned.slice(firstDotIndex + 1).replace(/\./g, '')
  return `${whole}${fraction}`
}

interface SwapFormProps {
  accountAddress?: string
  onCreateSwap: (input: {
    amountIn: number
    amountOut: number
    direction: 'xToY' | 'yToX'
    priorityLevel: PriorityLevel
    useJito: boolean
  }) => void
  onRequireConnect: () => Promise<void>
  pool: MeteoraPool
}

export function SwapForm({ accountAddress, onCreateSwap, onRequireConnect, pool }: SwapFormProps) {
  const [amountIn, setAmountIn] = React.useState('')
  const [direction, setDirection] = React.useState<'xToY' | 'yToX'>('xToY')
  const [priorityLevel, setPriorityLevel] = React.useState<PriorityLevel>('Medium')
  const [useJito, setUseJito] = React.useState(true)

  const parsedAmountIn = Number(amountIn) || 0
  const preview = estimateSwapPreview(pool, direction, parsedAmountIn, priorityLevel, useJito)
  const inputSymbol = direction === 'xToY' ? pool.token_x.symbol : pool.token_y.symbol
  const outputSymbol = direction === 'xToY' ? pool.token_y.symbol : pool.token_x.symbol

  async function handleSubmit() {
    if (!accountAddress) {
      try {
        await onRequireConnect()
      } catch {
        Alert.alert('Connect wallet first')
      }
      return
    }

    if (parsedAmountIn <= 0 || preview.amountOut <= 0) {
      Alert.alert('Enter an amount')
      return
    }

    onCreateSwap({
      amountIn: parsedAmountIn,
      amountOut: preview.amountOut,
      direction,
      priorityLevel,
      useJito,
    })

    Alert.alert('Swap recorded')
    setAmountIn('')
  }

  return (
    <View className="gap-5">
      <SectionCard className="gap-5">
        <View className="gap-2">
          <Text className="text-base font-semibold text-ink-900">Swap</Text>
          <Text className="text-sm leading-6 text-ink-700">Choose a direction, set size, and review the route.</Text>
        </View>

        <View className="gap-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Direction</Text>
          <PillSelector
            columns={1}
            onChange={setDirection}
            options={[
              { label: `${pool.token_x.symbol} -> ${pool.token_y.symbol}`, value: 'xToY' },
              { label: `${pool.token_y.symbol} -> ${pool.token_x.symbol}`, value: 'yToX' },
            ]}
            value={direction}
          />
        </View>

        <InputShell detail={`≈ ${formatCompactCurrency(preview.inputUsd)}`} label="Amount in">
          <TextInput
            className="p-0 text-[28px] font-semibold text-ink-900"
            keyboardType="decimal-pad"
            onChangeText={(value) => setAmountIn(sanitizeDecimal(value))}
            placeholder={`Enter ${inputSymbol}`}
            placeholderTextColor="#847d71"
            value={amountIn}
          />
        </InputShell>

        <View className="gap-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Priority</Text>
          <PillSelector columns={3} onChange={setPriorityLevel} options={priorityOptions} value={priorityLevel} />
        </View>

        <InputShell detail="MEV protection" label="Jito">
          <PillSelector
            columns={2}
            onChange={(nextValue) => setUseJito(nextValue === 'on')}
            options={[
              { label: 'On', value: 'on' },
              { label: 'Off', value: 'off' },
            ]}
            value={useJito ? 'on' : 'off'}
          />
        </InputShell>
      </SectionCard>

      <SectionCard className="gap-5" tone="muted">
        <Text className="text-base font-semibold text-ink-900">Preview</Text>
        <InputShell label="Estimated out" tone="raised">
          <Text selectable className="text-xl font-semibold text-ink-900">
            {formatTokenAmount(preview.amountOut)} {outputSymbol}
          </Text>
          <Text className="text-sm text-ink-700">{preview.executionLane}</Text>
        </InputShell>

        <View className="flex-row flex-wrap gap-3">
          <DataTile
            label="Trading fee"
            style={{ width: '48%' }}
            tone="raised"
            value={formatCompactCurrency(preview.feeUsd)}
          />
          <DataTile
            label="Price impact"
            style={{ width: '48%' }}
            tone="raised"
            value={formatPercentage(preview.priceImpactPct)}
          />
          <DataTile
            label="Priority fee"
            style={{ width: '48%' }}
            tone="raised"
            value={`${formatTokenAmount(preview.priorityFeeSol)} SOL`}
          />
          <DataTile
            label="Base fee"
            style={{ width: '48%' }}
            tone="raised"
            value={formatPercentage(pool.pool_config.base_fee_pct / 100)}
          />
        </View>

        <PrimaryButton
          iconName={accountAddress ? 'swap-horizontal' : 'wallet-outline'}
          label={accountAddress ? 'Swap' : 'Connect wallet'}
          onPress={() => {
            void handleSubmit()
          }}
          tone="brand"
        />
      </SectionCard>
    </View>
  )
}
