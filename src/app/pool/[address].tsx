import { Stack, useLocalSearchParams } from 'expo-router'
import * as React from 'react'
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native'

import { LiquidityForm } from '@/components/pool/liquidity-form'
import { SwapForm } from '@/components/pool/swap-form'
import { Badge } from '@/components/ui/badge'
import { DataTile } from '@/components/ui/data-tile'
import { pageContentStyle } from '@/components/ui/page-layout'
import { PillSelector } from '@/components/ui/pill-selector'
import { SectionCard } from '@/components/ui/section-card'
import { useAuthorizedMobileWallet } from '@/hooks/use-authorized-mobile-wallet'
import { buildAddLiquidityTransaction, buildSwapTransaction } from '@/lib/meteora-dlmm'
import { usePoolDetails } from '@/hooks/use-pool-details'
import { formatCompactCurrency, formatPercentage, formatTimeAgo, shortAddress } from '@/lib/formatters'
import { signAndSendTransactions } from '@/lib/solana'
import { useMvpStore } from '@/providers/mvp-store-provider'
import { PublicKey } from '@solana/web3.js'

export default function PoolDetailsScreen() {
  const params = useLocalSearchParams<{ address?: string }>()
  const address = typeof params.address === 'string' ? params.address : undefined
  const wallet = useAuthorizedMobileWallet()
  const { addPosition, recordSwap } = useMvpStore()
  const { isFallback, isLoading, pool, refresh } = usePoolDetails(address)
  const [activeTab, setActiveTab] = React.useState<'liquidity' | 'swap'>('liquidity')

  async function ensureWalletConnected() {
    try {
      await wallet.connect()
    } catch {
      Alert.alert('Unable to connect wallet')
    }
  }

  if (!pool) {
    return (
      <ScrollView
        contentContainerStyle={pageContentStyle}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} tintColor="#23685b" />}
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen options={{ title: 'Pool details' }} />
        <SectionCard className="gap-2">
          <Text className="text-base font-semibold text-ink-900">{isLoading ? 'Loading...' : 'Pool not found'}</Text>
          <Text className="text-sm text-ink-700">Pull to refresh and try again.</Text>
        </SectionCard>
      </ScrollView>
    )
  }

  const accountAddress = wallet.account?.address.toString()

  return (
    <ScrollView
      contentContainerStyle={pageContentStyle}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} tintColor="#23685b" />}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: pool.name }} />

      <SectionCard className="gap-5" tone="inverse">
        <View className="flex-row flex-wrap gap-2">
          <Badge label={`Bin ${pool.pool_config.bin_step}`} tone="inverse" />
          {pool.launchpad ? <Badge label={pool.launchpad} tone="success" /> : null}
          {pool.has_farm ? <Badge label="Farm" tone="accent" /> : null}
        </View>

        <View className="gap-3">
          <Text className="text-4xl font-semibold text-sand-50">{pool.name}</Text>
          <Text selectable className="text-sm text-sand-100">
            {shortAddress(pool.address)} · {pool.token_x.symbol}/{pool.token_y.symbol}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2.5">
          <DataTile label="TVL" style={{ width: '48%' }} tone="inverse" value={formatCompactCurrency(pool.tvl)} />
          <DataTile
            label="24H volume"
            style={{ width: '48%' }}
            tone="inverse"
            value={formatCompactCurrency(pool.volume['24h'])}
          />
          <DataTile label="24H APR" style={{ width: '48%' }} tone="inverse" value={formatPercentage(pool.apr)} />
          <DataTile
            label="Base fee"
            style={{ width: '48%' }}
            tone="inverse"
            value={formatPercentage(pool.pool_config.base_fee_pct / 100)}
          />
        </View>

        <Text className="text-[11px] font-semibold uppercase tracking-wide text-sand-100">
          {isFallback ? 'Offline snapshot' : 'Live data'} · Updated {formatTimeAgo(Date.now())}
        </Text>
      </SectionCard>

      <SectionCard className="gap-4" tone="muted">
        <Text className="text-base font-semibold text-ink-900">Actions</Text>

        <PillSelector
          columns={2}
          onChange={setActiveTab}
          options={[
            { label: 'Add liquidity', value: 'liquidity' },
            { label: 'Swap', value: 'swap' },
          ]}
          value={activeTab}
        />
      </SectionCard>

      {activeTab === 'liquidity' ? (
        <LiquidityForm
          accountAddress={accountAddress}
          onCreatePosition={async (input) => {
            if (!accountAddress) {
              throw new Error('Connect wallet first')
            }

            const prepared = await buildAddLiquidityTransaction({
              amountX: input.amountX,
              amountY: input.amountY,
              owner: accountAddress,
              poolAddress: pool.address,
              priorityLevel: input.priorityLevel,
              strategy: input.strategy,
              tokenXSymbol: pool.token_x.symbol,
              tokenYSymbol: pool.token_y.symbol,
            })

            const [signature] = await signAndSendTransactions({
              additionalSigners: [prepared.additionalSigners],
              owner: new PublicKey(accountAddress),
              transactions: [prepared.transaction],
              walletTransactor: wallet.transactWithWallet,
            })

            addPosition({
              depositedX: Number(input.amountX) || 0,
              depositedY: Number(input.amountY) || 0,
              mode: input.mode,
              note: '',
              ownerAddress: accountAddress ?? 'guest',
              pool,
              priorityLevel: input.priorityLevel,
              strategy: input.strategy,
              useJito: false,
            })

            void refresh()

            return {
              positionAddress: prepared.positionAddress,
              signature,
            }
          }}
          onRequireConnect={ensureWalletConnected}
          pool={pool}
        />
      ) : (
        <SwapForm
          accountAddress={accountAddress}
          onCreateSwap={async (input) => {
            if (!accountAddress) {
              throw new Error('Connect wallet first')
            }

            const { quote, transaction } = await buildSwapTransaction({
              amountIn: input.amountIn,
              direction: input.direction,
              owner: accountAddress,
              poolAddress: pool.address,
              priorityLevel: input.priorityLevel,
            })

            const [signature] = await signAndSendTransactions({
              owner: new PublicKey(accountAddress),
              transactions: [transaction],
              walletTransactor: wallet.transactWithWallet,
            })

            recordSwap({
              amountIn: Number(input.amountIn) || 0,
              amountOut: quote.amountOut,
              direction: input.direction,
              ownerAddress: accountAddress ?? 'guest',
              pool,
              priorityLevel: input.priorityLevel,
              useJito: false,
            })

            void refresh()

            return {
              quote,
              signature,
            }
          }}
          onRequireConnect={ensureWalletConnected}
          pool={pool}
        />
      )}
    </ScrollView>
  )
}
