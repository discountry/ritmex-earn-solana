import { ActivityIndicator, Pressable, Text, View } from 'react-native'

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
  label: string
  onPress?: () => void
  subtitle?: string
  tone?: PrimaryButtonTone
}

export function PrimaryButton({
  busy = false,
  className,
  disabled = false,
  label,
  onPress,
  subtitle,
  tone = 'dark',
}: PrimaryButtonProps) {
  const isDisabled = disabled || busy

  return (
    <Pressable
      className={cn(
        'min-h-14 rounded-3xl border px-4 py-3',
        buttonClasses[tone],
        isDisabled && 'opacity-50',
        className,
      )}
      disabled={isDisabled}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-center gap-2">
        {busy ? <ActivityIndicator color={tone === 'ghost' ? '#171512' : '#f6f1e7'} /> : null}
        <View className="items-center">
          <Text className={cn('text-base font-semibold', textClasses[tone])}>{label}</Text>
          {subtitle ? <Text className={cn('text-xs', textClasses[tone])}>{subtitle}</Text> : null}
        </View>
      </View>
    </Pressable>
  )
}
