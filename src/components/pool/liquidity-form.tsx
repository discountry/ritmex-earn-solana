import * as React from 'react'
import { Alert, Text, TextInput, View } from 'react-native'

import { DataTile } from '@/components/ui/data-tile'
import { InputShell } from '@/components/ui/input-shell'
import { PillSelector } from '@/components/ui/pill-selector'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { formatCompactCurrency, formatPercentage, formatTokenAmount } from '@/lib/formatters'
import { estimateLiquidityPreview } from '@/lib/position-estimator'
import type { LiquidityMode, MeteoraPool, PriceStrategy, PriorityLevel } from '@/types/meteora'

const liquidityModeOptions: { hint: string; label: string; value: LiquidityMode }[] = [
  { hint: 'Two assets', label: 'Balanced', value: 'Balanced' },
  { hint: 'Flexible', label: 'Custom', value: 'Imbalanced' },
  { hint: 'Single asset', label: 'One-sided', value: 'One-Sided' },
]

const priceStrategyOptions: { hint: string; label: string; value: PriceStrategy }[] = [
  { hint: 'Baseline', label: 'Default', value: 'Default' },
  { hint: 'Tighter range', label: 'Stable', value: 'Stable' },
  { hint: 'Wider range', label: 'Volatile', value: 'Volatile' },
]

const priorityOptions: { hint: string; label: string; value: PriorityLevel }[] = [
  { hint: 'Saver', label: 'Low', value: 'Low' },
  { hint: 'Balanced', label: 'Medium', value: 'Medium' },
  { hint: 'Faster', label: 'High', value: 'High' },
]

interface LiquidityFormProps {
  accountAddress?: string
  onCreatePosition: (input: {
    depositedX: number
    depositedY: number
    mode: LiquidityMode
    note: string
    priorityLevel: PriorityLevel
    strategy: PriceStrategy
    useJito: boolean
  }) => void
  onRequireConnect: () => Promise<void>
  pool: MeteoraPool
}

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

function parseAmount(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function LiquidityForm({ accountAddress, onCreatePosition, onRequireConnect, pool }: LiquidityFormProps) {
  const [amountX, setAmountX] = React.useState('')
  const [amountY, setAmountY] = React.useState('')
  const [autoBalance, setAutoBalance] = React.useState(true)
  const [lastEditedField, setLastEditedField] = React.useState<'x' | 'y'>('x')
  const [mode, setMode] = React.useState<LiquidityMode>('Balanced')
  const [note, setNote] = React.useState('')
  const [priorityLevel, setPriorityLevel] = React.useState<PriorityLevel>('Medium')
  const [singleAsset, setSingleAsset] = React.useState<'x' | 'y'>('x')
  const [strategy, setStrategy] = React.useState<PriceStrategy>('Stable')
  const [useJito, setUseJito] = React.useState(true)

  React.useEffect(() => {
    if (mode !== 'Balanced' || !autoBalance) {
      return
    }

    if (lastEditedField === 'x') {
      const parsedX = parseAmount(amountX)

      if (parsedX <= 0) {
        if (amountY !== '') {
          setAmountY('')
        }
        return
      }

      const nextValue = sanitizeDecimal((parsedX * pool.current_price).toFixed(2))
      if (nextValue !== amountY) {
        setAmountY(nextValue)
      }
    }

    if (lastEditedField === 'y') {
      const parsedY = parseAmount(amountY)

      if (parsedY <= 0) {
        if (amountX !== '') {
          setAmountX('')
        }
        return
      }

      const nextValue = sanitizeDecimal((parsedY / pool.current_price).toFixed(4))
      if (nextValue !== amountX) {
        setAmountX(nextValue)
      }
    }
  }, [amountX, amountY, autoBalance, lastEditedField, mode, pool.current_price])

  React.useEffect(() => {
    if (mode !== 'One-Sided') {
      return
    }

    if (singleAsset === 'x' && amountY !== '') {
      setAmountY('')
    }

    if (singleAsset === 'y' && amountX !== '') {
      setAmountX('')
    }
  }, [amountX, amountY, mode, singleAsset])

  const parsedAmountX = mode === 'One-Sided' && singleAsset === 'y' ? 0 : parseAmount(amountX)
  const parsedAmountY = mode === 'One-Sided' && singleAsset === 'x' ? 0 : parseAmount(amountY)

  const preview = estimateLiquidityPreview(pool, parsedAmountX, parsedAmountY, mode, priorityLevel, useJito)

  async function handleSubmit() {
    if (!accountAddress) {
      try {
        await onRequireConnect()
      } catch {
        Alert.alert('Connect wallet first')
      }
      return
    }

    if (preview.depositUsd <= 0) {
      Alert.alert('Enter an amount')
      return
    }

    if (mode !== 'One-Sided' && (parsedAmountX <= 0 || parsedAmountY <= 0)) {
      Alert.alert('Enter both token amounts')
      return
    }

    onCreatePosition({
      depositedX: parsedAmountX,
      depositedY: parsedAmountY,
      mode,
      note: note.trim(),
      priorityLevel,
      strategy,
      useJito,
    })

    Alert.alert('Position added')
    setAmountX('')
    setAmountY('')
    setNote('')
  }

  return (
    <View className="gap-5">
      <SectionCard className="gap-5">
        <View className="gap-2">
          <Text className="text-base font-semibold text-ink-900">Add liquidity</Text>
          <Text className="text-sm leading-6 text-ink-700">Set amount, range style, and execution mode.</Text>
        </View>

        <View className="gap-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Mode</Text>
          <PillSelector columns={3} onChange={setMode} options={liquidityModeOptions} value={mode} />
        </View>

        <View className="gap-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Range style</Text>
          <PillSelector columns={3} onChange={setStrategy} options={priceStrategyOptions} value={strategy} />
        </View>

        {mode === 'One-Sided' ? (
          <View className="gap-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Single asset</Text>
            <PillSelector
              columns={2}
              onChange={setSingleAsset}
              options={[
                { label: `Only ${pool.token_x.symbol}`, value: 'x' },
                { label: `Only ${pool.token_y.symbol}`, value: 'y' },
              ]}
              value={singleAsset}
            />
          </View>
        ) : null}

        {mode === 'Balanced' ? (
          <InputShell detail="Match the current price." label="Auto-balance">
            <PillSelector
              columns={2}
              onChange={(nextValue) => setAutoBalance(nextValue === 'on')}
              options={[
                { label: 'On', value: 'on' },
                { label: 'Off', value: 'off' },
              ]}
              value={autoBalance ? 'on' : 'off'}
            />
          </InputShell>
        ) : null}

        <View className="gap-4">
          <InputShell
            detail={`≈ ${formatCompactCurrency(parsedAmountX * pool.token_x.price)}`}
            label={`${pool.token_x.symbol} amount`}
          >
            <TextInput
              className="p-0 text-[28px] font-semibold text-ink-900"
              editable={mode !== 'One-Sided' || singleAsset === 'x'}
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setLastEditedField('x')
                setAmountX(sanitizeDecimal(value))
              }}
              placeholder={`Enter ${pool.token_x.symbol}`}
              placeholderTextColor="#847d71"
              value={amountX}
            />
          </InputShell>

          <InputShell
            detail={`≈ ${formatCompactCurrency(parsedAmountY * pool.token_y.price)}`}
            label={`${pool.token_y.symbol} amount`}
          >
            <TextInput
              className="p-0 text-[28px] font-semibold text-ink-900"
              editable={mode !== 'One-Sided' || singleAsset === 'y'}
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setLastEditedField('y')
                setAmountY(sanitizeDecimal(value))
              }}
              placeholder={`Enter ${pool.token_y.symbol}`}
              placeholderTextColor="#847d71"
              value={amountY}
            />
          </InputShell>
        </View>

        <InputShell label="Note">
          <TextInput
            className="min-h-[72px] p-0 text-base leading-6 text-ink-900"
            multiline
            onChangeText={setNote}
            placeholder="Optional"
            placeholderTextColor="#847d71"
            textAlignVertical="top"
            value={note}
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
        <View className="flex-row flex-wrap gap-3">
          <DataTile
            label="Deposit"
            style={{ width: '48%' }}
            tone="raised"
            value={formatCompactCurrency(preview.depositUsd)}
          />
          <DataTile
            label="Pool share"
            style={{ width: '48%' }}
            tone="raised"
            value={formatPercentage(preview.shareOfPool)}
          />
          <DataTile
            label="Daily fees"
            style={{ width: '48%' }}
            tone="raised"
            value={formatCompactCurrency(preview.dailyFeesUsd)}
          />
          <DataTile
            label="Priority fee"
            style={{ width: '48%' }}
            tone="raised"
            value={`${formatTokenAmount(preview.priorityFeeSol)} SOL`}
          />
        </View>

        <InputShell label="Execution" tone="raised">
          <Text className="text-sm font-semibold text-ink-900">{preview.executionQuality}</Text>
          <Text className="text-sm text-ink-700">
            {preview.rangeCoverage} · APR {formatPercentage(pool.apr)}
          </Text>
        </InputShell>

        <PrimaryButton
          iconName={accountAddress ? 'add-outline' : 'wallet-outline'}
          label={accountAddress ? 'Add liquidity' : 'Connect wallet'}
          onPress={() => {
            void handleSubmit()
          }}
          tone="dark"
        />
      </SectionCard>
    </View>
  )
}
