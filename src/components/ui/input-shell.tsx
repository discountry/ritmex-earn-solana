import type { PropsWithChildren } from 'react'
import { Text, View } from 'react-native'

import { cn } from '@/lib/cn'

type InputShellTone = 'default' | 'raised'

const toneClasses: Record<InputShellTone, string> = {
  default: 'border-sand-200 bg-sand-50',
  raised: 'border-sand-200 bg-white',
}

interface InputShellProps extends PropsWithChildren {
  className?: string
  detail?: string
  label: string
  tone?: InputShellTone
}

export function InputShell({ children, className, detail, label, tone = 'default' }: InputShellProps) {
  return (
    <View className={cn('min-h-[88px] gap-3 border px-4 py-4', toneClasses[tone], className)}>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">{label}</Text>
        {detail ? <Text className="text-xs text-ink-700">{detail}</Text> : null}
      </View>
      {children}
    </View>
  )
}
