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
      Alert.alert('连接失败', '请在支持 Solana Mobile 钱包的设备上授权钱包。')
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
          <Text className="text-base font-semibold text-ink-900">{isLoading ? '加载池子中…' : '没有找到这个池子'}</Text>
          <Text className="text-sm text-ink-700">返回市场页重新选择，或下拉重试刷新公开池子数据。</Text>
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
            {pool.launchpad ? `${pool.launchpad} 发射池 · ` : ''}
            Bin Step {pool.pool_config.bin_step} · {pool.has_farm ? '附带 Farm' : '纯 DLMM 池'}
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
          {isFallback ? '当前为离线池子快照。' : '当前为 Meteora Mainnet 公共池子数据。'} 最近刷新{' '}
          {formatTimeAgo(Date.now())}
        </Text>
      </SectionCard>

      <SectionCard className="gap-4" tone="muted">
        <View className="gap-1">
          <Text className="text-base font-semibold text-ink-900">执行工作台</Text>
          <Text className="text-sm text-ink-700">
            先在这里完成参数编排，再把仓位和动作同步到账户页，形成完整的 MVP 操作闭环。
          </Text>
        </View>

        <PillSelector
          onChange={setActiveTab}
          options={[
            { hint: '构建新的流动性仓位', label: 'Add Liquidity', value: 'liquidity' },
            { hint: '生成当前池子的兑换计划', label: 'Swap', value: 'swap' },
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
