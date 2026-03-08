import * as React from 'react'

import { fetchPools } from '@/lib/meteora-api'
import type { MarketSortKey, MeteoraPool } from '@/types/meteora'

interface UseMarketPoolsOptions {
  pageSize?: number
  query?: string
  sortKey?: MarketSortKey
}

export function useMarketPools({ pageSize = 12, query = '', sortKey = 'volume' }: UseMarketPoolsOptions = {}) {
  const [data, setData] = React.useState<MeteoraPool[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isFallback, setIsFallback] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<number | null>(null)
  const [refreshTick, setRefreshTick] = React.useState(0)

  React.useEffect(() => {
    let isMounted = true

    async function loadPools() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchPools({ pageSize, query, sortKey })

        if (!isMounted) {
          return
        }

        setData(result.data)
        setIsFallback(result.isFallback)
        setLastUpdatedAt(Date.now())
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load pool data')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPools()

    return () => {
      isMounted = false
    }
  }, [pageSize, query, refreshTick, sortKey])

  return {
    data,
    error,
    isFallback,
    isLoading,
    lastUpdatedAt,
    refresh: () => setRefreshTick((current) => current + 1),
  }
}
