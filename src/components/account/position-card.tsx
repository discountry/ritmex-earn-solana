import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { PrimaryButton } from '@/components/ui/primary-button'
import { SectionCard } from '@/components/ui/section-card'
import { formatCompactCurrency, formatPositionLabel, formatTimeAgo, formatTokenAmount } from '@/lib/formatters'
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
                {isClosed ? '已关闭' : '运行中'}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-ink-700">{formatPositionLabel(position)}</Text>
          <Text className="text-xs text-ink-700">
            {position.priorityLevel} 优先费 · {position.useJito ? 'Jito 保护' : '标准执行'} ·{' '}
            {formatTimeAgo(position.createdAt)}
          </Text>
        </Pressable>
      </Link>

      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[47%] flex-1 rounded-2xl bg-sand-50 px-3 py-3">
          <Text className="text-xs uppercase tracking-wide text-ink-700">仓位规模</Text>
          <Text className="mt-1 text-base font-semibold text-ink-900">
            {formatCompactCurrency(position.depositUsd)}
          </Text>
          <Text className="mt-1 text-xs text-ink-700">
            {formatTokenAmount(position.depositedX)} {position.tokenXSymbol} / {formatTokenAmount(position.depositedY)}{' '}
            {position.tokenYSymbol}
          </Text>
        </View>
        <View className="min-w-[47%] flex-1 rounded-2xl bg-sand-50 px-3 py-3">
          <Text className="text-xs uppercase tracking-wide text-ink-700">待领取费用</Text>
          <Text className="mt-1 text-base font-semibold text-ink-900">{formatCompactCurrency(accruedFees)}</Text>
          <Text className="mt-1 text-xs text-ink-700">已累计 {formatCompactCurrency(position.claimedFeesUsd)}</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <PrimaryButton className="flex-1" disabled={isClosed} label="收取费用" onPress={onCollect} tone="ghost" />
        <PrimaryButton className="flex-1" disabled={isClosed} label="关闭仓位" onPress={onClose} tone="dark" />
      </View>
    </SectionCard>
  )
}
