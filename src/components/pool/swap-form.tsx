import * as React from 'react'
import { Alert, Text, TextInput, View } from 'react-native'

import { DataTile } from '@/components/ui/data-tile'
import { InputShell } from '@/components/ui/input-shell'
import { PillSelector } from '@/components/ui/pill-selector'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { formatCompactCurrency, formatPercentage, formatTokenAmount, shortAddress } from '@/lib/formatters'
import { fetchSwapQuote } from '@/lib/meteora-dlmm'
import { estimateSwapPreview } from '@/lib/position-estimator'
import type { MeteoraPool, PriorityLevel, SwapQuoteView } from '@/types/meteora'

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
    amountIn: string
    direction: 'xToY' | 'yToX'
    priorityLevel: PriorityLevel
  }) => Promise<{ quote: SwapQuoteView; signature: string }>
  onRequireConnect: () => Promise<void>
  pool: MeteoraPool
}

export function SwapForm({ accountAddress, onCreateSwap, onRequireConnect, pool }: SwapFormProps) {
  const [amountIn, setAmountIn] = React.useState('')
  const [direction, setDirection] = React.useState<'xToY' | 'yToX'>('xToY')
  const [priorityLevel, setPriorityLevel] = React.useState<PriorityLevel>('Medium')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [liveQuote, setLiveQuote] = React.useState<SwapQuoteView | null>(null)
  const [quoteError, setQuoteError] = React.useState<string | null>(null)
  const [quoteLoading, setQuoteLoading] = React.useState(false)

  const parsedAmountIn = Number(amountIn) || 0
  const preview = estimateSwapPreview(pool, direction, parsedAmountIn, priorityLevel, false)
  const inputSymbol = direction === 'xToY' ? pool.token_x.symbol : pool.token_y.symbol
  const outputSymbol = direction === 'xToY' ? pool.token_y.symbol : pool.token_x.symbol
  const inputTokenPrice = direction === 'xToY' ? pool.token_x.price : pool.token_y.price
  const displayedQuote = liveQuote ?? {
    amountOut: preview.amountOut,
    feeAmount: preview.feeUsd / Math.max(inputTokenPrice, 0.000001),
    minAmountOut: preview.amountOut,
    priceImpactPct: preview.priceImpactPct * 100,
  }

  React.useEffect(() => {
    if (parsedAmountIn <= 0) {
      setLiveQuote(null)
      setQuoteError(null)
      setQuoteLoading(false)
      return
    }

    let active = true
    setQuoteLoading(true)
    setQuoteError(null)

    const timeoutId = setTimeout(() => {
      void fetchSwapQuote({
        amountIn,
        direction,
        poolAddress: pool.address,
      })
        .then((quote) => {
          if (active) {
            setLiveQuote(quote)
          }
        })
        .catch((error) => {
          if (active) {
            setLiveQuote(null)
            setQuoteError(error instanceof Error ? error.message : 'Unable to refresh the Meteora quote')
          }
        })
        .finally(() => {
          if (active) {
            setQuoteLoading(false)
          }
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [amountIn, direction, parsedAmountIn, pool.address])

  async function handleSubmit() {
    if (!accountAddress) {
      try {
        await onRequireConnect()
      } catch {
        Alert.alert('Connect wallet first')
      }
      return
    }

    if (parsedAmountIn <= 0 || displayedQuote.amountOut <= 0) {
      Alert.alert('Enter an amount')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onCreateSwap({
        amountIn,
        direction,
        priorityLevel,
      })

      setAmountIn('')
      setLiveQuote(result.quote)
      Alert.alert('Swap confirmed', shortAddress(result.signature))
    } catch (error) {
      Alert.alert('Swap failed', error instanceof Error ? error.message : 'The wallet rejected the transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View className="gap-4">
      <SectionCard className="gap-4">
        <View className="gap-2">
          <Text className="text-base font-semibold text-ink-900">Swap</Text>
          <Text className="text-sm leading-6 text-ink-700">Quote with Meteora, then submit the on-chain transaction.</Text>
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

        <InputShell detail={`≈ ${formatCompactCurrency(parsedAmountIn * inputTokenPrice)}`} label="Amount in">
          <TextInput
            className="p-0 text-[28px] font-semibold text-ink-900"
            editable={!isSubmitting}
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
      </SectionCard>

      <SectionCard className="gap-4" tone="muted">
        <Text className="text-base font-semibold text-ink-900">Preview</Text>
        <InputShell label="Estimated out" tone="raised">
          <Text selectable className="text-xl font-semibold text-ink-900">
            {formatTokenAmount(displayedQuote.amountOut)} {outputSymbol}
          </Text>
          <Text className="text-sm text-ink-700">
            {quoteLoading
              ? 'Refreshing live quote...'
              : `Min out ${formatTokenAmount(displayedQuote.minAmountOut)} ${outputSymbol}`}
          </Text>
          {quoteError ? <Text className="text-sm text-clay-700">{quoteError}</Text> : null}
        </InputShell>

        <View className="flex-row flex-wrap gap-2.5">
          <DataTile
            label="Trading fee"
            style={{ width: '48%' }}
            tone="raised"
            value={`${formatTokenAmount(displayedQuote.feeAmount)} ${inputSymbol}`}
          />
          <DataTile
            label="Price impact"
            style={{ width: '48%' }}
            tone="raised"
            value={formatPercentage(displayedQuote.priceImpactPct / 100)}
          />
          <DataTile
            label="Route"
            style={{ width: '48%' }}
            tone="raised"
            value={liveQuote ? 'Meteora live quote' : preview.executionLane}
          />
          <DataTile
            label="Base fee"
            style={{ width: '48%' }}
            tone="raised"
            value={formatPercentage(pool.pool_config.base_fee_pct / 100)}
          />
        </View>

        <PrimaryButton
          busy={isSubmitting}
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
