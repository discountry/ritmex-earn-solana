import { Pressable, Text, View } from 'react-native'

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
        <View className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-mint-600' : 'bg-clay-500'}`} />
        <Text className="text-sm font-medium text-ink-900">{connected ? shortAddress(address ?? '') : '连接钱包'}</Text>
      </View>
    </Pressable>
  )
}
