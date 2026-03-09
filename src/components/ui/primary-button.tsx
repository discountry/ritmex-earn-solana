import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import { AppIcon, type AppIconName } from '@/components/ui/app-icon'
import { cn } from '@/lib/cn'

type PrimaryButtonTone = 'dark' | 'brand' | 'ghost'

const buttonClasses: Record<PrimaryButtonTone, string> = {
  brand: 'bg-mint-600 border-mint-600',
  dark: 'bg-ink-900 border-ink-900',
  ghost: 'bg-transparent border-sand-200',
}

const textClasses: Record<PrimaryButtonTone, string> = {
  brand: 'text-white',
  dark: 'text-sand-50',
  ghost: 'text-ink-900',
}

interface PrimaryButtonProps {
  busy?: boolean
  className?: string
  disabled?: boolean
  iconName?: AppIconName
  label: string
  onPress?: () => void
  subtitle?: string
  tone?: PrimaryButtonTone
}

export function PrimaryButton({
  busy = false,
  className,
  disabled = false,
  iconName,
  label,
  onPress,
  subtitle,
  tone = 'dark',
}: PrimaryButtonProps) {
  const isDisabled = disabled || busy

  return (
    <Pressable
      className={cn('min-h-[56px] border px-4 py-3', buttonClasses[tone], isDisabled && 'opacity-50', className)}
      disabled={isDisabled}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-center gap-3">
        {busy ? <ActivityIndicator color={tone === 'ghost' ? '#171512' : '#f6f1e7'} /> : null}
        {!busy && iconName ? <AppIcon color={tone === 'ghost' ? '#171512' : '#f6f1e7'} name={iconName} /> : null}
        <View className="items-center gap-0.5">
          <Text className={cn('text-sm font-semibold uppercase tracking-wide', textClasses[tone])}>{label}</Text>
          {subtitle ? <Text className={cn('text-[11px]', textClasses[tone])}>{subtitle}</Text> : null}
        </View>
      </View>
    </Pressable>
  )
}
