import * as React from 'react'
import { router } from 'expo-router'
import { RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'

import { PoolMarketCard } from '@/components/market/pool-market-card'
import { PillSelector } from '@/components/ui/pill-selector'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { useMarketPools } from '@/hooks/use-market-pools'
import { formatCompactCurrency, formatPercentage, formatTimeAgo } from '@/lib/formatters'
import type { MarketSortKey } from '@/types/meteora'

const PAGE_CONTENT_STYLE = {
  gap: 20,
  padding: 24,
  paddingBottom: 132,
}

const sortOptions: { hint: string; label: string; value: MarketSortKey }[] = [
  { hint: '24H flow', label: 'Volume', value: 'volume' },
  { hint: 'Locked capital', label: 'TVL', value: 'tvl' },
  { hint: 'Yield view', label: 'APR', value: 'apr' },
  { hint: 'Pool take rate', label: 'Fees', value: 'fees' },
]

export default function MarketsScreen() {
  const [searchText, setSearchText] = React.useState('')
  const [sortKey, setSortKey] = React.useState<MarketSortKey>('volume')
  const deferredSearchText = React.useDeferredValue(searchText.trim())

  const { data, isFallback, isLoading, lastUpdatedAt, refresh } = useMarketPools({
    pageSize: 12,
    query: deferredSearchText,
    sortKey,
  })

  const heroPool = data[0]
  const feeLeader =
    [...data].sort((left, right) => right.fee_tvl_ratio['24h'] - left.fee_tvl_ratio['24h'])[0] ?? heroPool
  const fastestPool = [...data].sort((left, right) => right.apr - left.apr)[0] ?? heroPool

  return (
    <ScrollView
      contentContainerStyle={PAGE_CONTENT_STYLE}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} tintColor="#23685b" />}
      showsVerticalScrollIndicator={false}
    >
      <SectionCard className="gap-6" tone="inverse">
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="rounded-full bg-mint-600 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">DLMM</Text>
          </View>
          <View className="rounded-full bg-white/10 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-sand-100">Mainnet</Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-3xl font-semibold text-sand-50">DLMM markets</Text>
          <Text className="text-sm leading-6 text-sand-100">Scan volume, TVL, and APR without visual noise.</Text>
        </View>

        {heroPool ? (
          <View className="rounded-[28px] bg-white/10 px-5 py-5">
            <Text className="text-xs uppercase tracking-wide text-sand-100">Spotlight</Text>
            <Text className="mt-1 text-2xl font-semibold text-sand-50">{heroPool.name}</Text>
            <Text className="mt-2 text-sm text-sand-100">
              24H volume {formatCompactCurrency(heroPool.volume['24h'])} · TVL {formatCompactCurrency(heroPool.tvl)} ·
              APR {formatPercentage(heroPool.apr)}
            </Text>
          </View>
        ) : null}

        {heroPool ? (
          <PrimaryButton
            iconName="arrow-forward-circle-outline"
            label="Open pool"
            onPress={() => router.push({ pathname: '/pool/[address]', params: { address: heroPool.address } })}
            tone="brand"
          />
        ) : null}
      </SectionCard>

      <SectionCard className="gap-5" tone="muted">
        <Text className="text-base font-semibold text-ink-900">Filters</Text>

        <View className="rounded-[28px] bg-white px-5 py-4">
          <Text className="text-xs uppercase tracking-wide text-ink-700">Search</Text>
          <TextInput
            className="mt-2 text-base text-ink-900"
            onChangeText={(value) =>
              React.startTransition(() => {
                setSearchText(value)
              })
            }
            placeholder="Search pools or tokens"
            placeholderTextColor="#847d71"
            value={searchText}
          />
        </View>

        <PillSelector onChange={setSortKey} options={sortOptions} value={sortKey} />

        <View className="flex-row flex-wrap gap-4">
          {feeLeader ? (
            <View className="min-w-[47%] flex-1 rounded-3xl bg-white px-4 py-4">
              <Text className="text-xs uppercase tracking-wide text-ink-700">Top fee ratio</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">{feeLeader.name}</Text>
              <Text className="mt-1 text-sm text-ink-700">{formatPercentage(feeLeader.fee_tvl_ratio['24h'])}</Text>
            </View>
          ) : null}
          {fastestPool ? (
            <View className="min-w-[47%] flex-1 rounded-3xl bg-white px-4 py-4">
              <Text className="text-xs uppercase tracking-wide text-ink-700">Top APR</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">{fastestPool.name}</Text>
              <Text className="mt-1 text-sm text-ink-700">{formatPercentage(fastestPool.apr)}</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-xs text-ink-700">
          {isFallback ? 'Offline snapshot' : 'Live data'}
          {lastUpdatedAt ? ` · Updated ${formatTimeAgo(lastUpdatedAt)}` : ''}
        </Text>
      </SectionCard>

      <View className="gap-4">
        {data.map((pool) => (
          <PoolMarketCard key={pool.address} pool={pool} />
        ))}

        {!isLoading && data.length === 0 ? (
          <SectionCard className="gap-2">
            <Text className="text-base font-semibold text-ink-900">No matches</Text>
            <Text className="text-sm text-ink-700">Try a broader keyword or switch the sort order.</Text>
          </SectionCard>
        ) : null}
      </View>
    </ScrollView>
  )
}
