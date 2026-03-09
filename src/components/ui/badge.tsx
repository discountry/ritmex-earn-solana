import { Text, View } from 'react-native'

import { cn } from '@/lib/cn'

type BadgeTone = 'default' | 'inverse' | 'accent' | 'success'

const containerClasses: Record<BadgeTone, string> = {
  accent: 'border-clay-500/20 bg-clay-100',
  default: 'border-sand-200 bg-sand-100',
  inverse: 'border-white/15 bg-white/10',
  success: 'border-mint-600/20 bg-mint-100',
}

const textClasses: Record<BadgeTone, string> = {
  accent: 'text-clay-500',
  default: 'text-ink-700',
  inverse: 'text-sand-50',
  success: 'text-mint-600',
}

interface BadgeProps {
  className?: string
  label: string
  tone?: BadgeTone
}

export function Badge({ className, label, tone = 'default' }: BadgeProps) {
  return (
    <View className={cn('border px-3 py-2', containerClasses[tone], className)}>
      <Text className={cn('text-[11px] font-semibold uppercase tracking-wide', textClasses[tone])}>{label}</Text>
    </View>
  )
}
