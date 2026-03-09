import type { PropsWithChildren } from 'react'
import type { ViewProps } from 'react-native'
import { View } from 'react-native'

import { cn } from '@/lib/cn'

type SectionCardTone = 'default' | 'muted' | 'inverse' | 'accent'

const toneClasses: Record<SectionCardTone, string> = {
  accent: 'border-clay-500/20 bg-clay-100',
  default: 'border-sand-200 bg-white',
  inverse: 'border-ink-900 bg-ink-900',
  muted: 'border-sand-200 bg-sand-100',
}

interface SectionCardProps extends PropsWithChildren, ViewProps {
  className?: string
  tone?: SectionCardTone
}

export function SectionCard({ children, className, tone = 'default', ...props }: SectionCardProps) {
  return (
    <View className={cn('border px-5 py-5', toneClasses[tone], className)} {...props}>
      {children}
    </View>
  )
}
