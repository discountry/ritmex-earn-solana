import * as React from 'react'
import { router } from 'expo-router'
import { RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'

import { PoolMarketCard } from '@/components/market/pool-market-card'
import { Badge } from '@/components/ui/badge'
import { DataTile } from '@/components/ui/data-tile'
import { InputShell } from '@/components/ui/input-shell'
import { pageContentStyle } from '@/components/ui/page-layout'
import { PillSelector } from '@/components/ui/pill-selector'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { useMarketPools } from '@/hooks/use-market-pools'
import { formatCompactCurrency, formatPercentage, formatTimeAgo } from '@/lib/formatters'
import type { MarketSortKey } from '@/types/meteora'

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
      contentContainerStyle={pageContentStyle}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} tintColor="#23685b" />}
      showsVerticalScrollIndicator={false}
    >
      <SectionCard className="gap-5" tone="inverse">
        <View className="flex-row flex-wrap gap-2">
          <Badge label="DLMM" tone="success" />
          <Badge label="Mainnet" tone="inverse" />
        </View>

        <View className="gap-3">
          <Text className="text-4xl font-semibold text-sand-50">DLMM markets</Text>
          <Text className="text-sm leading-6 text-sand-100">Scan volume, TVL, and APR without visual noise.</Text>
        </View>

        {heroPool ? (
          <DataTile
            detail={`24H volume ${formatCompactCurrency(heroPool.volume['24h'])} · TVL ${formatCompactCurrency(heroPool.tvl)} · APR ${formatPercentage(heroPool.apr)}`}
            label="Spotlight"
            tone="inverse"
            value={heroPool.name}
          />
        ) : null}

        {heroPool ? (
          <PrimaryButton
            iconName="arrow-forward-outline"
            label="Open pool"
            onPress={() => router.push({ pathname: '/pool/[address]', params: { address: heroPool.address } })}
            tone="brand"
          />
        ) : null}
      </SectionCard>

      <SectionCard className="gap-4" tone="muted">
        <Text className="text-base font-semibold text-ink-900">Market filters</Text>

        <InputShell label="Search" tone="raised">
          <TextInput
            className="p-0 text-lg font-semibold text-ink-900"
            onChangeText={(value) =>
              React.startTransition(() => {
                setSearchText(value)
              })
            }
            placeholder="Search pools or tokens"
            placeholderTextColor="#847d71"
            value={searchText}
          />
        </InputShell>

        <View className="gap-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Sort by</Text>
          <PillSelector columns={2} onChange={setSortKey} options={sortOptions} value={sortKey} />
        </View>

        <View className="flex-row flex-wrap gap-2.5">
          {feeLeader ? (
            <DataTile
              detail={feeLeader.name}
              label="Top fee ratio"
              style={{ width: '48%' }}
              tone="raised"
              value={formatPercentage(feeLeader.fee_tvl_ratio['24h'])}
            />
          ) : null}
          {fastestPool ? (
            <DataTile
              detail={fastestPool.name}
              label="Top APR"
              style={{ width: '48%' }}
              tone="raised"
              value={formatPercentage(fastestPool.apr)}
            />
          ) : null}
        </View>

        <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">
          {isFallback ? 'Offline snapshot' : 'Live data'}
          {lastUpdatedAt ? ` · Updated ${formatTimeAgo(lastUpdatedAt)}` : ''}
        </Text>
      </SectionCard>

      <View className="gap-3">
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
