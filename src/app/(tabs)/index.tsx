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
  { hint: '24h 成交', label: 'Volume', value: 'volume' },
  { hint: '资金规模', label: 'TVL', value: 'tvl' },
  { hint: '收益表现', label: 'APR', value: 'apr' },
  { hint: '费率效率', label: 'Fees', value: 'fees' },
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
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">Android MVP</Text>
          </View>
          <View className="rounded-full bg-white/10 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-sand-100">Mainnet Data</Text>
          </View>
          <View className="rounded-full bg-white/10 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-sand-100">Jito Ready</Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-3xl font-semibold text-sand-50">用最短路径筛到值得做的 DLMM 池子。</Text>
          <Text className="text-sm leading-6 text-sand-100">
            RitMEX Earn MVP 聚焦热门池行情、池子执行方案和账户仓位管理，让 Solana Mobile 上的流动性动作先跑通。
          </Text>
        </View>

        {heroPool ? (
          <View className="rounded-3xl bg-white/10 px-4 py-4">
            <Text className="text-xs uppercase tracking-wide text-sand-100">当前焦点</Text>
            <Text className="mt-1 text-2xl font-semibold text-sand-50">{heroPool.name}</Text>
            <Text className="mt-2 text-sm text-sand-100">
              24h 交易量 {formatCompactCurrency(heroPool.volume['24h'])} · TVL {formatCompactCurrency(heroPool.tvl)} ·
              APR {formatPercentage(heroPool.apr)}
            </Text>
          </View>
        ) : null}

        {heroPool ? (
          <PrimaryButton
            label="打开焦点池子"
            onPress={() => router.push({ pathname: '/pool/[address]', params: { address: heroPool.address } })}
            subtitle="直接进入加流动性 / Swap 页面"
            tone="brand"
          />
        ) : null}
      </SectionCard>

      <SectionCard className="gap-4" tone="muted">
        <View className="gap-2">
          <Text className="text-base font-semibold text-ink-900">市场扫描</Text>
          <Text className="text-sm text-ink-700">
            按交易量、TVL、APR 或费率效率排序，快速找到适合进入的 Meteora DLMM 市场。
          </Text>
        </View>

        <View className="rounded-2xl bg-white px-4 py-3">
          <Text className="text-xs uppercase tracking-wide text-ink-700">搜索池子 / Token / 地址</Text>
          <TextInput
            className="mt-2 text-base text-ink-900"
            onChangeText={(value) =>
              React.startTransition(() => {
                setSearchText(value)
              })
            }
            placeholder="例如 SOL、USDC、JitoSOL"
            placeholderTextColor="#847d71"
            value={searchText}
          />
        </View>

        <PillSelector onChange={setSortKey} options={sortOptions} value={sortKey} />

        <View className="flex-row flex-wrap gap-3">
          {feeLeader ? (
            <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
              <Text className="text-xs uppercase tracking-wide text-ink-700">费率信号</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">{feeLeader.name}</Text>
              <Text className="mt-1 text-sm text-ink-700">{formatPercentage(feeLeader.fee_tvl_ratio['24h'])}</Text>
            </View>
          ) : null}
          {fastestPool ? (
            <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-3 py-3">
              <Text className="text-xs uppercase tracking-wide text-ink-700">高弹性池</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">{fastestPool.name}</Text>
              <Text className="mt-1 text-sm text-ink-700">{formatPercentage(fastestPool.apr)}</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-xs text-ink-700">
          {isFallback ? '当前展示的是离线兜底快照。' : '当前展示的是 Meteora Mainnet 实时公共数据。'}
          {lastUpdatedAt ? ` 最近刷新 ${formatTimeAgo(lastUpdatedAt)}` : ''}
        </Text>
      </SectionCard>

      <View className="gap-3">
        {data.map((pool) => (
          <PoolMarketCard key={pool.address} pool={pool} />
        ))}

        {!isLoading && data.length === 0 ? (
          <SectionCard className="gap-2">
            <Text className="text-base font-semibold text-ink-900">没有找到结果</Text>
            <Text className="text-sm text-ink-700">换一个关键词，或者回到默认排序继续浏览热门池子。</Text>
          </SectionCard>
        ) : null}
      </View>
    </ScrollView>
  )
}
