import * as React from 'react'
import { useAuthorization, useMobileWallet } from '@wallet-ui/react-native-kit'

export function useAuthorizedMobileWallet() {
  const wallet = useMobileWallet()
  const { authorizeSession } = useAuthorization({
    chain: wallet.chain,
    identity: wallet.identity,
    store: wallet.store,
  })
  const connectAnd = wallet.connectAnd as unknown as <T>(
    callback: (mobileWallet: unknown) => Promise<T>,
  ) => Promise<T>

  const transactWithWallet = React.useCallback(
    async <T,>(callback: (mobileWallet: { signTransactions(params: { payloads: string[] }): Promise<{ signed_payloads: string[] }> }) => Promise<T>) => {
      return connectAnd(async (mobileWallet) => {
        await authorizeSession(mobileWallet as Parameters<typeof authorizeSession>[0])
        return callback(
          mobileWallet as unknown as {
            signTransactions(params: { payloads: string[] }): Promise<{ signed_payloads: string[] }>
          },
        )
      })
    },
    [authorizeSession, connectAnd],
  )

  return {
    ...wallet,
    transactWithWallet,
  }
}
