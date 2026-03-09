import * as React from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { router } from 'expo-router'

import { PositionCard } from '@/components/account/position-card'
import { DataTile } from '@/components/ui/data-tile'
import { pageContentStyle } from '@/components/ui/page-layout'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { WalletPill } from '@/components/wallet/wallet-pill'
import { fallbackPools } from '@/data/fallback-pools'
import { useMvpStore } from '@/providers/mvp-store-provider'
import { formatCompactCurrency, formatTimeAgo, shortAddress } from '@/lib/formatters'
import { getAccruedFeesUsd } from '@/lib/position-estimator'

export default function AccountScreen() {
  const { account, connect, disconnect } = useMobileWallet()
  const { activity, closePosition, collectPositionFees, positions } = useMvpStore()

  const accountAddress = account?.address.toString()
  const accountPositions = positions.filter((position) => position.ownerAddress === accountAddress)
  const accountActivity = activity.filter((item) => item.ownerAddress === accountAddress)
  const activePositions = accountPositions.filter((position) => position.status === 'Active')
  const totalCapital = activePositions.reduce((sum, position) => sum + position.depositUsd, 0)
  const totalUnclaimedFees = activePositions.reduce((sum, position) => sum + getAccruedFeesUsd(position), 0)
  const totalClaimedFees = accountPositions.reduce((sum, position) => sum + position.claimedFeesUsd, 0)

  async function handleConnect() {
    try {
      await connect()
    } catch {
      Alert.alert('Unable to connect wallet')
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect()
    } catch {
      Alert.alert('Unable to disconnect wallet')
    }
  }

  return (
    <ScrollView
      contentContainerStyle={pageContentStyle}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <SectionCard className="gap-5" tone="inverse">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-3">
            <Text className="text-3xl font-semibold text-sand-50">Portfolio</Text>
            <Text className="text-sm leading-6 text-sand-100">Review positions, fees, and recent activity.</Text>
          </View>
          <WalletPill
            address={accountAddress}
            connected={Boolean(accountAddress)}
            onPress={accountAddress ? handleDisconnect : handleConnect}
          />
        </View>

        {accountAddress ? (
          <DataTile detail="Connected" label="Wallet" tone="inverse" value={shortAddress(accountAddress)} />
        ) : (
          <PrimaryButton
            iconName="wallet-outline"
            label="Connect wallet"
            onPress={() => void handleConnect()}
            tone="brand"
          />
        )}
      </SectionCard>

      <View className="flex-row flex-wrap gap-2.5">
        <DataTile
          detail={`Capital ${formatCompactCurrency(totalCapital)}`}
          label="Open positions"
          style={{ width: '48%' }}
          value={String(activePositions.length)}
        />
        <DataTile
          detail={`Collected ${formatCompactCurrency(totalClaimedFees)}`}
          label="Unclaimed fees"
          style={{ width: '48%' }}
          value={formatCompactCurrency(totalUnclaimedFees)}
        />
      </View>

      <SectionCard className="gap-4" tone="muted">
        <Text className="text-base font-semibold text-ink-900">Positions</Text>

        {accountAddress && accountPositions.length > 0 ? (
          <View className="gap-4">
            {accountPositions.map((position) => (
              <PositionCard
                key={position.id}
                onClose={() => {
                  closePosition(position.id)
                  Alert.alert('Position closed')
                }}
                onCollect={() => {
                  collectPositionFees(position.id)
                  Alert.alert('Fees collected')
                }}
                position={position}
              />
            ))}
          </View>
        ) : (
          <SectionCard className="gap-3">
            <Text className="text-base font-semibold text-ink-900">No positions yet</Text>
            <Text className="text-sm text-ink-700">Open a pool to create your first position.</Text>
            <PrimaryButton
              iconName="compass-outline"
              label="Browse markets"
              onPress={() =>
                router.push({ pathname: '/pool/[address]', params: { address: fallbackPools[0].address } })
              }
              tone="dark"
            />
          </SectionCard>
        )}
      </SectionCard>

      <SectionCard className="gap-4">
        <Text className="text-base font-semibold text-ink-900">Activity</Text>

        {accountAddress && accountActivity.length > 0 ? (
          <View className="gap-4">
            {accountActivity.map((item) => (
              <View key={item.id} className="gap-2 border border-sand-200 bg-sand-50 px-4 py-4">
                <Text className="text-sm font-medium text-ink-900">{item.title}</Text>
                <Text className="text-sm text-ink-700">{item.subtitle}</Text>
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">
                  {formatTimeAgo(item.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-ink-700">No recent activity.</Text>
        )}
      </SectionCard>
    </ScrollView>
  )
}
