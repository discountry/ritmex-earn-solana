import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { SectionCard } from '@/components/ui/section-card'
import { formatCompactCurrency, formatPercentage, shortAddress } from '@/lib/formatters'
import type { MeteoraPool } from '@/types/meteora'

interface PoolMarketCardProps {
  pool: MeteoraPool
}

export function PoolMarketCard({ pool }: PoolMarketCardProps) {
  return (
    <Link href={{ pathname: '/pool/[address]', params: { address: pool.address } }} asChild>
      <Pressable>
        <SectionCard className="gap-4">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-lg font-semibold text-ink-900">{pool.name}</Text>
                <View className="rounded-full bg-sand-100 px-2 py-1">
                  <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">
                    Bin {pool.pool_config.bin_step}
                  </Text>
                </View>
                {pool.has_farm ? (
                  <View className="rounded-full bg-clay-100 px-2 py-1">
                    <Text className="text-[11px] font-semibold text-clay-500">Farm</Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-sm text-ink-700">
                {pool.token_x.symbol} / {pool.token_y.symbol} · {shortAddress(pool.address)}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-xs uppercase tracking-wide text-ink-700">24h 交易量</Text>
              <Text className="text-base font-semibold text-ink-900">{formatCompactCurrency(pool.volume['24h'])}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View className="min-w-[29%] flex-1 rounded-2xl bg-sand-50 px-3 py-3">
              <Text className="text-xs uppercase tracking-wide text-ink-700">TVL</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">{formatCompactCurrency(pool.tvl)}</Text>
            </View>
            <View className="min-w-[29%] flex-1 rounded-2xl bg-sand-50 px-3 py-3">
              <Text className="text-xs uppercase tracking-wide text-ink-700">24h APR</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">{formatPercentage(pool.apr)}</Text>
            </View>
            <View className="min-w-[29%] flex-1 rounded-2xl bg-sand-50 px-3 py-3">
              <Text className="text-xs uppercase tracking-wide text-ink-700">费率效率</Text>
              <Text className="mt-1 text-base font-semibold text-ink-900">
                {formatPercentage(pool.fee_tvl_ratio['24h'])}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-ink-700">
              现价 {pool.token_x.symbol}/{pool.token_y.symbol} · {formatCompactCurrency(pool.current_price)}
            </Text>
            <Text className="text-sm font-semibold text-mint-600">打开池子</Text>
          </View>
        </SectionCard>
      </Pressable>
    </Link>
  )
}
