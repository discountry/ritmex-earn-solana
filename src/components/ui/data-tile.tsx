import type { ViewProps } from 'react-native'
import { Text, View } from 'react-native'

import { cn } from '@/lib/cn'

type DataTileTone = 'default' | 'inverse' | 'raised' | 'accent'

const containerClasses: Record<DataTileTone, string> = {
  accent: 'border-clay-500/20 bg-clay-100',
  default: 'border-sand-200 bg-sand-50',
  inverse: 'border-white/15 bg-white/10',
  raised: 'border-sand-200 bg-white',
}

const labelClasses: Record<DataTileTone, string> = {
  accent: 'text-clay-500',
  default: 'text-ink-700',
  inverse: 'text-sand-100',
  raised: 'text-ink-700',
}

const valueClasses: Record<DataTileTone, string> = {
  accent: 'text-ink-900',
  default: 'text-ink-900',
  inverse: 'text-sand-50',
  raised: 'text-ink-900',
}

interface DataTileProps extends ViewProps {
  className?: string
  detail?: string
  label: string
  tone?: DataTileTone
  value: string
}

export function DataTile({ className, detail, label, style, tone = 'default', value, ...props }: DataTileProps) {
  return (
    <View
      className={cn('min-h-[96px] justify-between border px-4 py-4', containerClasses[tone], className)}
      style={[{ minWidth: 0 }, style]}
      {...props}
    >
      <Text className={cn('text-[11px] font-semibold uppercase tracking-wide', labelClasses[tone])}>{label}</Text>
      <View className="gap-1">
        <Text
          selectable
          className={cn('text-lg font-semibold leading-8', valueClasses[tone])}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {value}
        </Text>
        {detail ? <Text className={cn('text-xs leading-5', labelClasses[tone])}>{detail}</Text> : null}
      </View>
    </View>
  )
}
