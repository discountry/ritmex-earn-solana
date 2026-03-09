import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { AppIcon } from '@/components/ui/app-icon'
import { Badge } from '@/components/ui/badge'
import { DataTile } from '@/components/ui/data-tile'
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
        <SectionCard className="gap-5 px-4 py-4">
          <View className="gap-4">
            <View className="flex-row flex-wrap gap-2">
              <Badge label={`Bin ${pool.pool_config.bin_step}`} />
              {pool.has_farm ? <Badge label="Farm" tone="accent" /> : null}
            </View>
            <View className="gap-1">
              <Text selectable className="text-xl font-semibold text-ink-900">
                {pool.name}
              </Text>
              <Text className="text-sm text-ink-700">
                {pool.token_x.symbol} / {pool.token_y.symbol} · {shortAddress(pool.address)}
              </Text>
            </View>
            <View className="gap-1 border border-sand-200 bg-sand-50 px-4 py-3">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">24H volume</Text>
              <Text selectable className="text-lg font-semibold text-ink-900">
                {formatCompactCurrency(pool.volume['24h'])}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <DataTile label="TVL" style={{ width: '48%' }} value={formatCompactCurrency(pool.tvl)} />
            <DataTile label="24H APR" style={{ width: '48%' }} value={formatPercentage(pool.apr)} />
            <DataTile label="Fee ratio" style={{ width: '100%' }} value={formatPercentage(pool.fee_tvl_ratio['24h'])} />
          </View>

          <View className="flex-row flex-wrap items-center justify-between gap-3 border-t border-sand-200 pt-4">
            <Text className="flex-1 text-sm text-ink-700" style={{ minWidth: 0 }}>
              Price {pool.token_x.symbol}/{pool.token_y.symbol} · {formatCompactCurrency(pool.current_price)}
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-semibold uppercase tracking-wide text-mint-600">Open</Text>
              <AppIcon color="#23685b" name="arrow-forward" size={16} />
            </View>
          </View>
        </SectionCard>
      </Pressable>
    </Link>
  )
}
