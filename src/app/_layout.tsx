import '../global.css'

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { MobileWalletProvider, createSolanaMainnet } from '@wallet-ui/react-native-kit'

import { MvpStoreProvider } from '@/providers/mvp-store-provider'

const cluster = createSolanaMainnet('https://api.mainnet-beta.solana.com')
const identity = {
  name: 'RitMEX Earn',
  uri: 'https://ritmex.app',
}

export default function Layout() {
  return (
    <MobileWalletProvider cluster={cluster} identity={identity}>
      <MvpStoreProvider>
        <StatusBar style="dark" backgroundColor="#f6f1e7" />
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: '#f6f1e7',
            },
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: '#f6f1e7',
            },
            headerTintColor: '#171512',
            headerTitleStyle: {
              fontSize: 15,
              fontWeight: '700',
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="pool/[address]" options={{ title: 'Pool details' }} />
        </Stack>
      </MvpStoreProvider>
    </MobileWalletProvider>
  )
}
