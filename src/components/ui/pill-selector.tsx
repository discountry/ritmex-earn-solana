import { Pressable, Text, View } from 'react-native'

import { cn } from '@/lib/cn'

export interface PillOption<T extends string> {
  hint?: string
  label: string
  value: T
}

interface PillSelectorProps<T extends string> {
  columns?: 1 | 2 | 3
  onChange: (value: T) => void
  options: PillOption<T>[]
  value: T
}

const widthStyleByColumns = {
  1: { width: '100%' },
  2: { width: '48%' },
  3: { width: '30.5%' },
} as const

export function PillSelector<T extends string>({ columns = 2, onChange, options, value }: PillSelectorProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {options.map((option) => {
        const selected = option.value === value

        return (
          <Pressable
            key={option.value}
            className={cn(
              'min-h-[56px] justify-between border px-4 py-3',
              selected ? 'border-ink-900 bg-ink-900' : 'border-sand-200 bg-white',
            )}
            onPress={() => onChange(option.value)}
            style={widthStyleByColumns[columns]}
          >
            <Text className={cn('text-sm font-semibold', selected ? 'text-sand-50' : 'text-ink-900')}>
              {option.label}
            </Text>
            {option.hint ? (
              <Text className={cn('text-[11px] uppercase tracking-wide', selected ? 'text-sand-100' : 'text-ink-700')}>
                {option.hint}
              </Text>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}
