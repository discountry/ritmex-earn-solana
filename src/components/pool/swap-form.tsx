import * as React from 'react'
import { Alert, Switch, Text, TextInput, View } from 'react-native'

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

        <PillSelector
          onChange={setDirection}
          options={[
            { label: `${pool.token_x.symbol} -> ${pool.token_y.symbol}`, value: 'xToY' },
            { label: `${pool.token_y.symbol} -> ${pool.token_x.symbol}`, value: 'yToX' },
          ]}
          value={direction}
        />

        <View className="rounded-3xl bg-sand-50 px-5 py-4">
          <Text className="text-sm font-medium text-ink-900">Amount in</Text>
          <TextInput
            className="mt-2 text-2xl font-semibold text-ink-900"
            keyboardType="decimal-pad"
            onChangeText={(value) => setAmountIn(sanitizeDecimal(value))}
            placeholder={`Enter ${inputSymbol}`}
            placeholderTextColor="#847d71"
            value={amountIn}
          />
          <Text className="mt-1 text-xs text-ink-700">≈ {formatCompactCurrency(preview.inputUsd)}</Text>
        </View>

        <PillSelector onChange={setPriorityLevel} options={priorityOptions} value={priorityLevel} />

        <View className="flex-row items-center justify-between rounded-3xl bg-sand-50 px-5 py-4">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-medium text-ink-900">Jito</Text>
            <Text className="text-xs text-ink-700">MEV protection</Text>
          </View>
          <Switch onValueChange={setUseJito} value={useJito} />
        </View>
      </SectionCard>

      <SectionCard className="gap-5" tone="muted">
        <Text className="text-base font-semibold text-ink-900">Preview</Text>
        <View className="rounded-3xl bg-white px-5 py-4">
          <Text className="text-xs uppercase tracking-wide text-ink-700">Estimated out</Text>
          <Text className="mt-1 text-xl font-semibold text-ink-900">
            {formatTokenAmount(preview.amountOut)} {outputSymbol}
          </Text>
          <Text className="mt-1 text-sm text-ink-700">{preview.executionLane}</Text>
        </View>

        <View className="flex-row flex-wrap gap-4">
          <View className="min-w-[47%] flex-1 rounded-3xl bg-white px-4 py-4">
            <Text className="text-xs uppercase tracking-wide text-ink-700">Trading fee</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">{formatCompactCurrency(preview.feeUsd)}</Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-3xl bg-white px-4 py-4">
            <Text className="text-xs uppercase tracking-wide text-ink-700">Price impact</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatPercentage(preview.priceImpactPct)}
            </Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-3xl bg-white px-4 py-4">
            <Text className="text-xs uppercase tracking-wide text-ink-700">Priority fee</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatTokenAmount(preview.priorityFeeSol)} SOL
            </Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-3xl bg-white px-4 py-4">
            <Text className="text-xs uppercase tracking-wide text-ink-700">Base fee</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatPercentage(pool.pool_config.base_fee_pct / 100)}
            </Text>
          </View>
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
