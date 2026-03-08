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
      Alert.alert('连接失败', '请在支持 Solana Mobile 钱包的设备上打开并授权。')
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect()
    } catch {
      Alert.alert('断开失败', '当前钱包会话未能正常关闭，请重试。')
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
            <Text className="text-3xl font-semibold text-sand-50">账户与仓位</Text>
            <Text className="text-sm leading-6 text-sand-100">
              钱包接入后，你创建的流动性计划、收取动作和 Swap 记录都会集中到这里。
            </Text>
          </View>
          <WalletPill
            address={accountAddress}
            connected={Boolean(accountAddress)}
            onPress={accountAddress ? handleDisconnect : handleConnect}
          />
        </View>

        {accountAddress ? (
          <View className="rounded-3xl bg-white/10 px-4 py-4">
            <Text className="text-xs uppercase tracking-wide text-sand-100">当前钱包</Text>
            <Text selectable className="mt-1 text-lg font-semibold text-sand-50">
              {shortAddress(accountAddress)}
            </Text>
            <Text className="mt-2 text-sm text-sand-100">
              Solana Mainnet · Solana Mobile Android · 本地仓位编排已启用
            </Text>
          </View>
        ) : (
          <PrimaryButton
            label="连接 Solana Mobile 钱包"
            onPress={() => void handleConnect()}
            subtitle="连接后开始创建和管理你的仓位"
            tone="brand"
          />
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
        <View className="gap-1">
          <Text className="text-base font-semibold text-ink-900">仓位清单</Text>
          <Text className="text-sm text-ink-700">从池子详情页生成的仓位会出现在这里，并支持收取费用与关闭。</Text>
        </View>

        {accountAddress && accountPositions.length > 0 ? (
          <View className="gap-3">
            {accountPositions.map((position) => (
              <PositionCard
                key={position.id}
                onClose={() => {
                  closePosition(position.id)
                  Alert.alert('仓位已关闭', '这个仓位已标记为关闭状态。')
                }}
                onCollect={() => {
                  collectPositionFees(position.id)
                  Alert.alert('费用已收取', '已将当前估算费用结转到已收取部分。')
                }}
                position={position}
              />
            ))}
          </View>
        ) : (
          <SectionCard className="gap-3">
            <Text className="text-base font-semibold text-ink-900">还没有仓位</Text>
            <Text className="text-sm text-ink-700">先去市场页选择一个热门池子，生成你的第一笔流动性计划。</Text>
            <PrimaryButton
              label="打开热门池子"
              onPress={() =>
                router.push({ pathname: '/pool/[address]', params: { address: fallbackPools[0].address } })
              }
              subtitle={fallbackPools[0].name}
              tone="dark"
            />
          </SectionCard>
        )}
      </SectionCard>

      <SectionCard className="gap-4">
        <View className="gap-1">
          <Text className="text-base font-semibold text-ink-900">活动流</Text>
          <Text className="text-sm text-ink-700">这里会记录仓位创建、Swap 计划、收取费用和关闭仓位等动作。</Text>
        </View>

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
          <Text className="text-sm text-ink-700">连接钱包并执行几次操作后，这里会开始积累你的账户轨迹。</Text>
        )}
      </SectionCard>
    </ScrollView>
  )
}
