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
    <Pressable className="border border-sand-200 bg-white px-4 py-3" onPress={onPress}>
      <View className="flex-row items-center gap-2">
        <View
          className={`h-8 w-8 items-center justify-center border ${connected ? 'border-mint-600 bg-mint-100' : 'border-clay-500 bg-clay-100'}`}
        >
          <AppIcon
            color={connected ? '#23685b' : '#a24b2b'}
            name={connected ? 'checkmark-outline' : 'wallet-outline'}
            size={16}
          />
        </View>
        <Text className="text-sm font-semibold text-ink-900">
          {connected ? shortAddress(address ?? '') : 'Connect wallet'}
        </Text>
      </View>
    </Pressable>
  )
}
