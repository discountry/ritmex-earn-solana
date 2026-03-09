import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { AppIcon } from '@/components/ui/app-icon'
import { Badge } from '@/components/ui/badge'
import { DataTile } from '@/components/ui/data-tile'
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
        <Pressable className="gap-3">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text selectable className="text-xl font-semibold text-ink-900">
                {position.poolName}
              </Text>
              <Text className="text-sm text-ink-700">{formatPositionLabel(position)}</Text>
            </View>
            <Badge label={isClosed ? 'Closed' : 'Active'} tone={isClosed ? 'default' : 'accent'} />
          </View>

          <View className="flex-row flex-wrap items-center gap-3">
            <View className="flex-row items-center gap-1">
              <AppIcon color="#6a655d" name="options-outline" size={14} />
              <Text className="text-xs uppercase tracking-wide text-ink-700">
                {formatPriorityLabel(position.priorityLevel)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <AppIcon color="#6a655d" name={position.useJito ? 'shield-outline' : 'flash-outline'} size={14} />
              <Text className="text-xs uppercase tracking-wide text-ink-700">
                {position.useJito ? 'Jito' : 'Standard'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <AppIcon color="#6a655d" name="time-outline" size={14} />
              <Text className="text-xs uppercase tracking-wide text-ink-700">{formatTimeAgo(position.createdAt)}</Text>
            </View>
          </View>
        </Pressable>
      </Link>

      <View className="flex-row flex-wrap gap-2.5">
        <DataTile
          detail={`${formatTokenAmount(position.depositedX)} ${position.tokenXSymbol} / ${formatTokenAmount(position.depositedY)} ${position.tokenYSymbol}`}
          label="Size"
          style={{ width: '48%' }}
          value={formatCompactCurrency(position.depositUsd)}
        />
        <DataTile
          detail={`Collected ${formatCompactCurrency(position.claimedFeesUsd)}`}
          label="Unclaimed"
          style={{ width: '48%' }}
          value={formatCompactCurrency(accruedFees)}
        />
      </View>

      <View className="flex-row gap-2.5 border-t border-sand-200 pt-3">
        <PrimaryButton
          className="flex-1"
          disabled={isClosed}
          iconName="cash-outline"
          label="Collect"
          onPress={onCollect}
          tone="ghost"
        />
        <PrimaryButton
          className="flex-1"
          disabled={isClosed}
          iconName="close-outline"
          label="Close"
          onPress={onClose}
          tone="dark"
        />
      </View>
    </SectionCard>
  )
}
