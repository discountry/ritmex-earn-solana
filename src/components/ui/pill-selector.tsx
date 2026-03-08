import { Pressable, Text, View } from 'react-native'

import { cn } from '@/lib/cn'

export interface PillOption<T extends string> {
  hint?: string
  label: string
  value: T
}

interface PillSelectorProps<T extends string> {
  onChange: (value: T) => void
  options: PillOption<T>[]
  value: T
}

export function PillSelector<T extends string>({ onChange, options, value }: PillSelectorProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {options.map((option) => {
        const selected = option.value === value

        return (
          <Pressable
            key={option.value}
            className={cn(
              'rounded-[24px] border px-4 py-3',
              selected ? 'border-ink-900 bg-ink-900' : 'border-sand-200 bg-white',
            )}
            onPress={() => onChange(option.value)}
          >
            <Text className={cn('text-sm font-medium', selected ? 'text-sand-50' : 'text-ink-900')}>
              {option.label}
            </Text>
            {option.hint ? (
              <Text className={cn('text-[11px]', selected ? 'text-sand-100' : 'text-ink-700')}>{option.hint}</Text>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}
