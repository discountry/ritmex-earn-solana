import { fallbackPools } from '@/data/fallback-pools'
import type { MarketSortKey, MeteoraPool } from '@/types/meteora'

const API_BASE_URL = 'https://dlmm.datapi.meteora.ag'

const sortMap: Record<MarketSortKey, string> = {
  apr: 'apr_24h:desc',
  fees: 'fee_tvl_ratio_24h:desc',
  tvl: 'tvl:desc',
  volume: 'volume_24h:desc',
}

interface MeteoraPoolsResponse {
  total: number
  pages: number
  current_page: number
  page_size: number
  data: MeteoraPool[]
}

interface FetchPoolsOptions {
  pageSize?: number
  query?: string
  sortKey?: MarketSortKey
}

function buildUrl(pathname: string, params: Record<string, string | number | undefined>) {
  const url = new URL(pathname, API_BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return
    }

    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

function sortPools(pools: MeteoraPool[], sortKey: MarketSortKey) {
  const sorted = [...pools]

  sorted.sort((left, right) => {
    switch (sortKey) {
      case 'apr':
        return right.apr - left.apr
      case 'fees':
        return right.fee_tvl_ratio['24h'] - left.fee_tvl_ratio['24h']
      case 'tvl':
        return right.tvl - left.tvl
      default:
        return right.volume['24h'] - left.volume['24h']
    }
  })

  return sorted
}

function filterFallbackPools(query: string, sortKey: MarketSortKey) {
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = fallbackPools.filter((pool) => {
    if (!normalizedQuery) {
      return true
    }

    return (
      pool.address.toLowerCase().includes(normalizedQuery) ||
      pool.name.toLowerCase().includes(normalizedQuery) ||
      pool.token_x.symbol.toLowerCase().includes(normalizedQuery) ||
      pool.token_y.symbol.toLowerCase().includes(normalizedQuery)
    )
  })

  return sortPools(filtered, sortKey)
}

async function requestPools(params: Record<string, string | number | undefined>) {
  const response = await fetch(buildUrl('/pools', params), {
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Meteora API 请求失败: ${response.status}`)
  }

  return (await response.json()) as MeteoraPoolsResponse
}

export async function fetchPools({ pageSize = 12, query = '', sortKey = 'volume' }: FetchPoolsOptions = {}) {
  try {
    const response = await requestPools({
      filter_by: 'is_blacklisted=false',
      page: 1,
      page_size: pageSize,
      query: query.trim(),
      sort_by: sortMap[sortKey],
    })

    return {
      data: response.data,
      isFallback: false,
      total: response.total,
    }
  } catch {
    const data = filterFallbackPools(query, sortKey).slice(0, pageSize)

    return {
      data,
      isFallback: true,
      total: data.length,
    }
  }
}

export async function fetchPoolByAddress(address: string) {
  try {
    const response = await requestPools({
      page: 1,
      page_size: 4,
      query: address,
    })

    const exactMatch = response.data.find((pool) => pool.address === address) ?? response.data[0] ?? null

    return {
      isFallback: false,
      pool: exactMatch,
    }
  } catch {
    return {
      isFallback: true,
      pool: fallbackPools.find((pool) => pool.address === address) ?? null,
    }
  }
}
