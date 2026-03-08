import { Pressable, Text, View } from 'react-native'

import { AppIcon } from '@/components/ui/app-icon'
import { shortAddress } from '@/lib/formatters'

interface WalletPillProps {
  address?: string
  connected: boolean
  onPress: () => void
}

export function WalletPill({ address, connected, onPress }: WalletPillProps) {
  return (
    <Pressable className="rounded-full border border-sand-200 bg-white px-4 py-2" onPress={onPress}>
      <View className="flex-row items-center gap-2">
        <View
          className={`h-7 w-7 items-center justify-center rounded-full ${connected ? 'bg-mint-100' : 'bg-clay-100'}`}
        >
          <AppIcon
            color={connected ? '#23685b' : '#a24b2b'}
            name={connected ? 'checkmark-circle' : 'wallet-outline'}
            size={16}
          />
        </View>
        <Text className="text-sm font-medium text-ink-900">{connected ? shortAddress(address ?? '') : '连接钱包'}</Text>
      </View>
    </Pressable>
  )
}
