import * as React from 'react'
import { Alert, Switch, Text, TextInput, View } from 'react-native'

import { PillSelector } from '@/components/ui/pill-selector'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { formatCompactCurrency, formatPercentage, formatTokenAmount } from '@/lib/formatters'
import { estimateLiquidityPreview } from '@/lib/position-estimator'
import type { LiquidityMode, MeteoraPool, PriceStrategy, PriorityLevel } from '@/types/meteora'

const liquidityModeOptions: { hint: string; label: string; value: LiquidityMode }[] = [
  { hint: '双边', label: '均衡', value: 'Balanced' },
  { hint: '自定义', label: '偏置', value: 'Imbalanced' },
  { hint: '单资产', label: '单边', value: 'One-Sided' },
]

const priceStrategyOptions: { hint: string; label: string; value: PriceStrategy }[] = [
  { hint: '常规', label: '默认', value: 'Default' },
  { hint: '窄区间', label: '稳定', value: 'Stable' },
  { hint: '宽区间', label: '波动', value: 'Volatile' },
]

const priorityOptions: { hint: string; label: string; value: PriorityLevel }[] = [
  { hint: '较低', label: '低', value: 'Low' },
  { hint: '推荐', label: '中', value: 'Medium' },
  { hint: '较快', label: '高', value: 'High' },
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
        Alert.alert('请先连接钱包')
      }
      return
    }

    if (preview.depositUsd <= 0) {
      Alert.alert('请输入金额')
      return
    }

    if (mode !== 'One-Sided' && (parsedAmountX <= 0 || parsedAmountY <= 0)) {
      Alert.alert('请输入双边数量')
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

    Alert.alert('已添加仓位')
    setAmountX('')
    setAmountY('')
    setNote('')
  }

  return (
    <View className="gap-4">
      <SectionCard className="gap-4">
        <View className="gap-2">
          <Text className="text-base font-semibold text-ink-900">添加流动性</Text>
          <Text className="text-sm text-ink-700">输入数量并选择模式</Text>
        </View>

        <PillSelector onChange={setMode} options={liquidityModeOptions} value={mode} />
        <PillSelector onChange={setStrategy} options={priceStrategyOptions} value={strategy} />

        {mode === 'One-Sided' ? (
          <PillSelector
            onChange={setSingleAsset}
            options={[
              { label: `仅 ${pool.token_x.symbol}`, value: 'x' },
              { label: `仅 ${pool.token_y.symbol}`, value: 'y' },
            ]}
            value={singleAsset}
          />
        ) : null}

        <View className="flex-row items-center justify-between rounded-2xl bg-sand-50 px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-medium text-ink-900">自动配平</Text>
            <Text className="text-xs text-ink-700">按当前价格换算</Text>
          </View>
          <Switch onValueChange={setAutoBalance} value={autoBalance && mode === 'Balanced'} />
        </View>

        <View className="gap-3">
          <View className="rounded-2xl bg-sand-50 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-ink-900">{pool.token_x.symbol} 数量</Text>
              <Text className="text-xs text-ink-700">
                ≈ {formatCompactCurrency(parsedAmountX * pool.token_x.price)}
              </Text>
            </View>
            <TextInput
              className="mt-2 text-2xl font-semibold text-ink-900"
              editable={mode !== 'One-Sided' || singleAsset === 'x'}
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setLastEditedField('x')
                setAmountX(sanitizeDecimal(value))
              }}
              placeholder={`输入 ${pool.token_x.symbol}`}
              placeholderTextColor="#847d71"
              value={amountX}
            />
          </View>

          <View className="rounded-2xl bg-sand-50 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-ink-900">{pool.token_y.symbol} 数量</Text>
              <Text className="text-xs text-ink-700">
                ≈ {formatCompactCurrency(parsedAmountY * pool.token_y.price)}
              </Text>
            </View>
            <TextInput
              className="mt-2 text-2xl font-semibold text-ink-900"
              editable={mode !== 'One-Sided' || singleAsset === 'y'}
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setLastEditedField('y')
                setAmountY(sanitizeDecimal(value))
              }}
              placeholder={`输入 ${pool.token_y.symbol}`}
              placeholderTextColor="#847d71"
              value={amountY}
            />
          </View>
        </View>

        <View className="rounded-2xl bg-sand-50 px-4 py-3">
          <Text className="text-sm font-medium text-ink-900">备注</Text>
          <TextInput
            className="mt-2 text-base text-ink-900"
            multiline
            onChangeText={setNote}
            placeholder="可选"
            placeholderTextColor="#847d71"
            value={note}
          />
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
        <View className="flex-row flex-wrap gap-3">
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-ink-700">投入</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatCompactCurrency(preview.depositUsd)}
            </Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-ink-700">占比</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">{formatPercentage(preview.shareOfPool)}</Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-ink-700">日收益</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatCompactCurrency(preview.dailyFeesUsd)}
            </Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-ink-700">优先费</Text>
            <Text className="mt-1 text-base font-semibold text-ink-900">
              {formatTokenAmount(preview.priorityFeeSol)} SOL
            </Text>
          </View>
        </View>

        <View className="rounded-2xl bg-white px-4 py-3">
          <Text className="text-sm font-medium text-ink-900">{preview.executionQuality}</Text>
          <Text className="mt-1 text-sm text-ink-700">
            {preview.rangeCoverage} · APR {formatPercentage(pool.apr)}
          </Text>
        </View>

        <PrimaryButton
          label={accountAddress ? '添加流动性' : '连接钱包'}
          onPress={() => {
            void handleSubmit()
          }}
          tone="dark"
        />
      </SectionCard>
    </View>
  )
}
