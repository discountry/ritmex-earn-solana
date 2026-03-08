import * as React from 'react'

import { fetchPoolByAddress } from '@/lib/meteora-api'
import type { MeteoraPool } from '@/types/meteora'

export function usePoolDetails(address?: string) {
  const [error, setError] = React.useState<string | null>(null)
  const [isFallback, setIsFallback] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [pool, setPool] = React.useState<MeteoraPool | null>(null)
  const [refreshTick, setRefreshTick] = React.useState(0)

  React.useEffect(() => {
    let isMounted = true

    async function loadPool() {
      if (!address) {
        setIsLoading(false)
        setPool(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchPoolByAddress(address)

        if (!isMounted) {
          return
        }

        setPool(result.pool)
        setIsFallback(result.isFallback)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load pool details')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPool()

    return () => {
      isMounted = false
    }
  }, [address, refreshTick])

  return {
    error,
    isFallback,
    isLoading,
    pool,
    refresh: () => setRefreshTick((current) => current + 1),
  }
}
