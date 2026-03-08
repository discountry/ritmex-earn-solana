import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { AppIcon } from '@/components/ui/app-icon'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import {
  formatCompactCurrency,
  formatPositionLabel,
  formatPriorityLabel,
  formatTimeAgo,
  formatTokenAmount,
} from '@/lib/formatters'
import { getAccruedFeesUsd } from '@/lib/position-estimator'
import type { DraftPosition } from '@/types/meteora'

interface PositionCardProps {
  onClose: () => void
  onCollect: () => void
  position: DraftPosition
}

export function PositionCard({ onClose, onCollect, position }: PositionCardProps) {
  const accruedFees = getAccruedFeesUsd(position)
  const isClosed = position.status === 'Closed'

  return (
    <SectionCard className="gap-4">
      <Link href={{ pathname: '/pool/[address]', params: { address: position.poolAddress } }} asChild>
        <Pressable className="gap-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-lg font-semibold text-ink-900">{position.poolName}</Text>
            <View className={`rounded-full px-2 py-1 ${isClosed ? 'bg-sand-100' : 'bg-clay-100'}`}>
              <Text className={`text-[11px] font-semibold ${isClosed ? 'text-ink-700' : 'text-clay-500'}`}>
                {isClosed ? '已关闭' : '活跃'}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-ink-700">{formatPositionLabel(position)}</Text>
          <View className="flex-row flex-wrap items-center gap-3">
            <View className="flex-row items-center gap-1">
              <AppIcon color="#6a655d" name="options-outline" size={14} />
              <Text className="text-xs text-ink-700">{formatPriorityLabel(position.priorityLevel)}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <AppIcon
                color="#6a655d"
                name={position.useJito ? 'shield-checkmark-outline' : 'flash-outline'}
                size={14}
              />
              <Text className="text-xs text-ink-700">{position.useJito ? 'Jito' : '标准'}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <AppIcon color="#6a655d" name="time-outline" size={14} />
              <Text className="text-xs text-ink-700">{formatTimeAgo(position.createdAt)}</Text>
            </View>
          </View>
        </Pressable>
      </Link>

      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[47%] flex-1 rounded-2xl bg-sand-50 px-3 py-3">
          <Text className="text-xs uppercase tracking-wide text-ink-700">规模</Text>
          <Text className="mt-1 text-base font-semibold text-ink-900">
            {formatCompactCurrency(position.depositUsd)}
          </Text>
          <Text className="mt-1 text-xs text-ink-700">
            {formatTokenAmount(position.depositedX)} {position.tokenXSymbol} / {formatTokenAmount(position.depositedY)}{' '}
            {position.tokenYSymbol}
          </Text>
        </View>
        <View className="min-w-[47%] flex-1 rounded-2xl bg-sand-50 px-3 py-3">
          <Text className="text-xs uppercase tracking-wide text-ink-700">未领取</Text>
          <Text className="mt-1 text-base font-semibold text-ink-900">{formatCompactCurrency(accruedFees)}</Text>
          <Text className="mt-1 text-xs text-ink-700">已领取 {formatCompactCurrency(position.claimedFeesUsd)}</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <PrimaryButton
          className="flex-1"
          disabled={isClosed}
          iconName="cash-outline"
          label="收取"
          onPress={onCollect}
          tone="ghost"
        />
        <PrimaryButton
          className="flex-1"
          disabled={isClosed}
          iconName="close-circle-outline"
          label="关闭"
          onPress={onClose}
          tone="dark"
        />
      </View>
    </SectionCard>
  )
}
