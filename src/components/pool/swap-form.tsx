import * as React from 'react'
import { Alert, Switch, Text, TextInput, View } from 'react-native'

import { PillSelector } from '@/components/ui/pill-selector'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { formatCompactCurrency, formatPercentage, formatTokenAmount } from '@/lib/formatters'
import { estimateSwapPreview } from '@/lib/position-estimator'
import type { MeteoraPool, PriorityLevel } from '@/types/meteora'

const priorityOptions: { hint: string; label: string; value: PriorityLevel }[] = [
  { hint: '较低', label: '低', value: 'Low' },
  { hint: '推荐', label: '中', value: 'Medium' },
  { hint: '较快', label: '高', value: 'High' },
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
        Alert.alert('请先连接钱包')
      }
      return
    }

    if (parsedAmountIn <= 0 || preview.amountOut <= 0) {
      Alert.alert('请输入数量')
      return
    }

    onCreateSwap({
      amountIn: parsedAmountIn,
      amountOut: preview.amountOut,
      direction,
      priorityLevel,
      useJito,
    })

    Alert.alert('已添加记录')
    setAmountIn('')
  }

  return (
    <View className="gap-4">
      <SectionCard className="gap-4">
        <View className="gap-2">
          <Text className="text-base font-semibold text-ink-900">兑换</Text>
          <Text className="text-sm text-ink-700">输入数量并选择方向</Text>
        </View>

        <PillSelector
          onChange={setDirection}
          options={[
            { label: `${pool.token_x.symbol} -> ${pool.token_y.symbol}`, value: 'xToY' },
            { label: `${pool.token_y.symbol} -> ${pool.token_x.symbol}`, value: 'yToX' },
          ]}
          value={direction}
        />

        <View className="rounded-2xl bg-sand-50 px-4 py-3">
          <Text className="text-sm font-medium text-ink-900">输入数量</Text>
          <TextInput
            className="mt-2 text-2xl font-semibold text-ink-900"
            keyboardType="decimal-pad"
            onChangeText={(value) => setAmountIn(sanitizeDecimal(value))}
            placeholder={`输入 ${inputSymbol}`}
            placeholderTextColor="#847d71"
            value={amountIn}
          />
          <Text className="mt-1 text-xs text-ink-700">≈ {formatCompactCurrency(preview.inputUsd)}</Text>
        </View>

        <PillSelector onChange={setPriorityLevel} options={priorityOptions} value={priorityLevel} />

        <View className="flex-row items-center justify-between rounded-2xl bg-sand-50 px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-medium text-ink-900">Jito</Text>
            <Text className="text-xs text-ink-700">MEV 保护</Text>
          </View>
          <Switch onValueChange={setUseJito} value={useJito} />
        </View>
      </SectionCard>

      <SectionCard className="gap-4" tone="muted">
        <Text className="text-base font-semibold text-ink-900">预估</Text>
        <View className="rounded-2xl bg-white px-4 py-3">
          <Text className="text-xs uppercase tracking-wide text-ink-700">预计收到</Text>
          <Text className="mt-1 text-xl font-semibold text-ink-900">
            {formatTokenAmount(preview.amountOut)} {outputSymbol}
          </Text>
          <Text className="mt-1 text-sm text-ink-700">{preview.executionLane}</Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-ink-700">交易费</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">{formatCompactCurrency(preview.feeUsd)}</Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-ink-700">价格冲击</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatPercentage(preview.priceImpactPct)}
            </Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-ink-700">优先费</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatTokenAmount(preview.priorityFeeSol)} SOL
            </Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-ink-700">池子基础费率</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatPercentage(pool.pool_config.base_fee_pct / 100)}
            </Text>
          </View>
        </View>

        <PrimaryButton
          label={accountAddress ? '兑换' : '连接钱包'}
          onPress={() => {
            void handleSubmit()
          }}
          tone="brand"
        />
      </SectionCard>
    </View>
  )
}
