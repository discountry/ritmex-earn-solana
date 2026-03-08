import { Stack, useLocalSearchParams } from 'expo-router'
import * as React from 'react'
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'

import { LiquidityForm } from '@/components/pool/liquidity-form'
import { SwapForm } from '@/components/pool/swap-form'
import { PillSelector } from '@/components/ui/pill-selector'
import { SectionCard } from '@/components/ui/section-card'
import { usePoolDetails } from '@/hooks/use-pool-details'
import { formatCompactCurrency, formatPercentage, formatTimeAgo, shortAddress } from '@/lib/formatters'
import { useMvpStore } from '@/providers/mvp-store-provider'

const PAGE_CONTENT_STYLE = {
  gap: 16,
  padding: 20,
  paddingBottom: 120,
}

export default function PoolDetailsScreen() {
  const params = useLocalSearchParams<{ address?: string }>()
  const address = typeof params.address === 'string' ? params.address : undefined
  const { account, connect } = useMobileWallet()
  const { addPosition, recordSwap } = useMvpStore()
  const { isFallback, isLoading, pool, refresh } = usePoolDetails(address)
  const [activeTab, setActiveTab] = React.useState<'liquidity' | 'swap'>('liquidity')

  async function ensureWalletConnected() {
    try {
      await connect()
    } catch {
      Alert.alert('钱包连接失败')
    }
  }

  if (!pool) {
    return (
      <ScrollView
        contentContainerStyle={PAGE_CONTENT_STYLE}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} tintColor="#23685b" />}
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen options={{ title: '池子详情' }} />
        <SectionCard className="gap-2">
          <Text className="text-base font-semibold text-ink-900">{isLoading ? '加载中…' : '未找到池子'}</Text>
          <Text className="text-sm text-ink-700">下拉刷新重试</Text>
        </SectionCard>
      </ScrollView>
    )
  }

  const accountAddress = account?.address.toString()

  return (
    <ScrollView
      contentContainerStyle={PAGE_CONTENT_STYLE}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} tintColor="#23685b" />}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: pool.name }} />

      <SectionCard className="gap-5" tone="inverse">
        <View className="gap-2">
          <Text className="text-3xl font-semibold text-sand-50">{pool.name}</Text>
          <Text selectable className="text-sm text-sand-100">
            {shortAddress(pool.address)} · {pool.token_x.symbol}/{pool.token_y.symbol}
          </Text>
          <Text className="text-sm leading-6 text-sand-100">
            {pool.launchpad ? `${pool.launchpad} · ` : ''}Bin {pool.pool_config.bin_step}
            {pool.has_farm ? ' · Farm' : ''}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white/10 px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-sand-100">TVL</Text>
            <Text className="mt-1 text-base font-semibold text-sand-50">{formatCompactCurrency(pool.tvl)}</Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white/10 px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-sand-100">24h 成交</Text>
            <Text className="mt-1 text-base font-semibold text-sand-50">
              {formatCompactCurrency(pool.volume['24h'])}
            </Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white/10 px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-sand-100">24h APR</Text>
            <Text className="mt-1 text-base font-semibold text-sand-50">{formatPercentage(pool.apr)}</Text>
          </View>
          <View className="min-w-[47%] flex-1 rounded-2xl bg-white/10 px-3 py-3">
            <Text className="text-xs uppercase tracking-wide text-sand-100">基础费率</Text>
            <Text className="mt-1 text-base font-semibold text-sand-50">
              {formatPercentage(pool.pool_config.base_fee_pct / 100)}
            </Text>
          </View>
        </View>

        <Text className="text-xs text-sand-100">
          {isFallback ? '离线数据' : '实时数据'} · {formatTimeAgo(Date.now())}
        </Text>
      </SectionCard>

      <SectionCard className="gap-4" tone="muted">
        <Text className="text-base font-semibold text-ink-900">操作</Text>

        <PillSelector
          onChange={setActiveTab}
          options={[
            { label: '加流动性', value: 'liquidity' },
            { label: '兑换', value: 'swap' },
          ]}
          value={activeTab}
        />
      </SectionCard>

      {activeTab === 'liquidity' ? (
        <LiquidityForm
          accountAddress={accountAddress}
          onCreatePosition={(input) => {
            addPosition({
              mode: input.mode,
              note: input.note,
              ownerAddress: accountAddress ?? 'guest',
              pool,
              depositedX: input.depositedX,
              depositedY: input.depositedY,
              priorityLevel: input.priorityLevel,
              strategy: input.strategy,
              useJito: input.useJito,
            })
          }}
          onRequireConnect={ensureWalletConnected}
          pool={pool}
        />
      ) : (
        <SwapForm
          accountAddress={accountAddress}
          onCreateSwap={(input) => {
            recordSwap({
              amountIn: input.amountIn,
              amountOut: input.amountOut,
              direction: input.direction,
              ownerAddress: accountAddress ?? 'guest',
              pool,
              priorityLevel: input.priorityLevel,
              useJito: input.useJito,
            })
          }}
          onRequireConnect={ensureWalletConnected}
          pool={pool}
        />
      )}
    </ScrollView>
  )
}
