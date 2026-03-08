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
  gap: 16,
  padding: 20,
  paddingBottom: 120,
}

const sortOptions: { hint: string; label: string; value: MarketSortKey }[] = [
  { hint: '24h 成交', label: '成交量', value: 'volume' },
  { hint: '资金规模', label: 'TVL', value: 'tvl' },
  { hint: '收益表现', label: 'APR', value: 'apr' },
  { hint: '费率效率', label: '费率', value: 'fees' },
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
      <SectionCard className="gap-5" tone="inverse">
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="rounded-full bg-mint-600 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">DLMM</Text>
          </View>
          <View className="rounded-full bg-white/10 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-sand-100">主网</Text>
          </View>
          <View className="rounded-full bg-white/10 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-sand-100">热门</Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-3xl font-semibold text-sand-50">热门 DLMM 池</Text>
          <Text className="text-sm leading-6 text-sand-100">查看交易量、TVL 和 APR</Text>
        </View>

        {heroPool ? (
          <View className="rounded-3xl bg-white/10 px-4 py-4">
            <Text className="text-xs uppercase tracking-wide text-sand-100">今日热门</Text>
            <Text className="mt-1 text-2xl font-semibold text-sand-50">{heroPool.name}</Text>
            <Text className="mt-2 text-sm text-sand-100">
              24h 交易量 {formatCompactCurrency(heroPool.volume['24h'])} · TVL {formatCompactCurrency(heroPool.tvl)} ·
              APR {formatPercentage(heroPool.apr)}
            </Text>
          </View>
        ) : null}

        {heroPool ? (
          <PrimaryButton
            label="查看详情"
            onPress={() => router.push({ pathname: '/pool/[address]', params: { address: heroPool.address } })}
            tone="brand"
          />
        ) : null}
      </SectionCard>

      <SectionCard className="gap-4" tone="muted">
        <Text className="text-base font-semibold text-ink-900">筛选</Text>

        <View className="rounded-2xl bg-white px-4 py-3">
          <Text className="text-xs uppercase tracking-wide text-ink-700">搜索</Text>
          <TextInput
            className="mt-2 text-base text-ink-900"
            onChangeText={(value) =>
              React.startTransition(() => {
                setSearchText(value)
              })
            }
            placeholder="搜索池子或代币"
            placeholderTextColor="#847d71"
            value={searchText}
          />
        </View>

        <PillSelector onChange={setSortKey} options={sortOptions} value={sortKey} />

        <View className="flex-row flex-wrap gap-3">
          {feeLeader ? (
            <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
              <Text className="text-xs uppercase tracking-wide text-ink-700">费率</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">{feeLeader.name}</Text>
              <Text className="mt-1 text-sm text-ink-700">{formatPercentage(feeLeader.fee_tvl_ratio['24h'])}</Text>
            </View>
          ) : null}
          {fastestPool ? (
            <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
              <Text className="text-xs uppercase tracking-wide text-ink-700">APR</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">{fastestPool.name}</Text>
              <Text className="mt-1 text-sm text-ink-700">{formatPercentage(fastestPool.apr)}</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-xs text-ink-700">
          {isFallback ? '离线数据' : '实时数据'}
          {lastUpdatedAt ? ` 最近刷新 ${formatTimeAgo(lastUpdatedAt)}` : ''}
        </Text>
      </SectionCard>

      <View className="gap-3">
        {data.map((pool) => (
          <PoolMarketCard key={pool.address} pool={pool} />
        ))}

        {!isLoading && data.length === 0 ? (
          <SectionCard className="gap-2">
            <Text className="text-base font-semibold text-ink-900">没有结果</Text>
            <Text className="text-sm text-ink-700">试试其他关键词</Text>
          </SectionCard>
        ) : null}
      </View>
    </ScrollView>
  )
}
