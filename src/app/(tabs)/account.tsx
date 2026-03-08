import * as React from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { router } from 'expo-router'

import { PositionCard } from '@/components/account/position-card'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { WalletPill } from '@/components/wallet/wallet-pill'
import { fallbackPools } from '@/data/fallback-pools'
import { useMvpStore } from '@/providers/mvp-store-provider'
import { formatCompactCurrency, formatTimeAgo, shortAddress } from '@/lib/formatters'
import { getAccruedFeesUsd } from '@/lib/position-estimator'

const PAGE_CONTENT_STYLE = {
  gap: 16,
  padding: 20,
  paddingBottom: 120,
}

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
      Alert.alert('钱包连接失败')
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect()
    } catch {
      Alert.alert('断开失败')
    }
  }

  return (
    <ScrollView
      contentContainerStyle={PAGE_CONTENT_STYLE}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <SectionCard className="gap-5" tone="inverse">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <Text className="text-3xl font-semibold text-sand-50">账户</Text>
            <Text className="text-sm leading-6 text-sand-100">查看仓位和记录</Text>
          </View>
          <WalletPill
            address={accountAddress}
            connected={Boolean(accountAddress)}
            onPress={accountAddress ? handleDisconnect : handleConnect}
          />
        </View>

        {accountAddress ? (
          <View className="rounded-3xl bg-white/10 px-4 py-4">
            <Text className="text-xs uppercase tracking-wide text-sand-100">钱包</Text>
            <Text selectable className="mt-1 text-lg font-semibold text-sand-50">
              {shortAddress(accountAddress)}
            </Text>
            <Text className="mt-2 text-sm text-sand-100">已连接</Text>
          </View>
        ) : (
          <PrimaryButton iconName="wallet-outline" label="连接钱包" onPress={() => void handleConnect()} tone="brand" />
        )}
      </SectionCard>

      <View className="flex-row flex-wrap gap-3">
        <SectionCard className="min-w-[47%] flex-1 gap-2">
          <Text className="text-xs uppercase tracking-wide text-ink-700">活跃仓位</Text>
          <Text className="text-2xl font-semibold text-ink-900">{activePositions.length}</Text>
          <Text className="text-sm text-ink-700">总投入 {formatCompactCurrency(totalCapital)}</Text>
        </SectionCard>
        <SectionCard className="min-w-[47%] flex-1 gap-2">
          <Text className="text-xs uppercase tracking-wide text-ink-700">待领取费用</Text>
          <Text className="text-2xl font-semibold text-ink-900">{formatCompactCurrency(totalUnclaimedFees)}</Text>
          <Text className="text-sm text-ink-700">累计收取 {formatCompactCurrency(totalClaimedFees)}</Text>
        </SectionCard>
      </View>

      <SectionCard className="gap-4" tone="muted">
        <Text className="text-base font-semibold text-ink-900">仓位</Text>

        {accountAddress && accountPositions.length > 0 ? (
          <View className="gap-3">
            {accountPositions.map((position) => (
              <PositionCard
                key={position.id}
                onClose={() => {
                  closePosition(position.id)
                  Alert.alert('已关闭仓位')
                }}
                onCollect={() => {
                  collectPositionFees(position.id)
                  Alert.alert('已收取费用')
                }}
                position={position}
              />
            ))}
          </View>
        ) : (
          <SectionCard className="gap-3">
            <Text className="text-base font-semibold text-ink-900">暂无仓位</Text>
            <Text className="text-sm text-ink-700">去看看热门池</Text>
            <PrimaryButton
              iconName="compass-outline"
              label="查看热门池"
              onPress={() =>
                router.push({ pathname: '/pool/[address]', params: { address: fallbackPools[0].address } })
              }
              tone="dark"
            />
          </SectionCard>
        )}
      </SectionCard>

      <SectionCard className="gap-4">
        <Text className="text-base font-semibold text-ink-900">记录</Text>

        {accountAddress && accountActivity.length > 0 ? (
          <View className="gap-3">
            {accountActivity.map((item) => (
              <View key={item.id} className="rounded-2xl bg-sand-50 px-4 py-3">
                <Text className="text-sm font-medium text-ink-900">{item.title}</Text>
                <Text className="mt-1 text-sm text-ink-700">{item.subtitle}</Text>
                <Text className="mt-2 text-xs text-ink-700">{formatTimeAgo(item.createdAt)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-ink-700">暂无记录</Text>
        )}
      </SectionCard>
    </ScrollView>
  )
}
