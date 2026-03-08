export type PoolMetricWindow = '30m' | '1h' | '2h' | '4h' | '12h' | '24h'

export type MarketSortKey = 'volume' | 'tvl' | 'apr' | 'fees'
export type PriorityLevel = 'Low' | 'Medium' | 'High'
export type LiquidityMode = 'Balanced' | 'Imbalanced' | 'One-Sided'
export type PriceStrategy = 'Default' | 'Stable' | 'Volatile'
export type PositionStatus = 'Active' | 'Queued' | 'Closed'

export interface MeteoraToken {
  address: string
  name: string
  symbol: string
  decimals: number
  is_verified: boolean
  holders: number
  freeze_authority_disabled: boolean
  total_supply: number
  price: number
  market_cap: number
}

export interface MeteoraPoolConfig {
  bin_step: number
  base_fee_pct: number
  max_fee_pct: number
  protocol_fee_pct: number
}

export interface MeteoraPoolWindowMetrics {
  '30m': number
  '1h': number
  '2h': number
  '4h': number
  '12h': number
  '24h': number
}

export interface MeteoraPool {
  address: string
  name: string
  token_x: MeteoraToken
  token_y: MeteoraToken
  reserve_x: string
  reserve_y: string
  token_x_amount: number
  token_y_amount: number
  created_at: number
  reward_mint_x: string
  reward_mint_y: string
  pool_config: MeteoraPoolConfig
  dynamic_fee_pct: number
  tvl: number
  current_price: number
  apr: number
  apy: number
  has_farm: boolean
  farm_apr: number
  farm_apy: number
  volume: MeteoraPoolWindowMetrics
  fees: MeteoraPoolWindowMetrics
  protocol_fees: MeteoraPoolWindowMetrics
  fee_tvl_ratio: MeteoraPoolWindowMetrics
  cumulative_metrics: {
    volume: number
    trade_fee: number
    protocol_fee: number
  }
  is_blacklisted: boolean
  launchpad: string
  tags: string[]
}

export interface DraftPosition {
  id: string
  ownerAddress: string
  poolAddress: string
  poolName: string
  tokenXSymbol: string
  tokenYSymbol: string
  depositedX: number
  depositedY: number
  depositUsd: number
  apr: number
  strategy: PriceStrategy
  mode: LiquidityMode
  priorityLevel: PriorityLevel
  useJito: boolean
  createdAt: number
  lastCollectedAt: number
  claimedFeesUsd: number
  status: PositionStatus
  note: string
}

export interface ActivityItem {
  id: string
  ownerAddress: string
  kind: 'liquidity' | 'swap' | 'collect' | 'close'
  title: string
  subtitle: string
  createdAt: number
}

export interface AddPositionInput {
  ownerAddress: string
  pool: MeteoraPool
  depositedX: number
  depositedY: number
  strategy: PriceStrategy
  mode: LiquidityMode
  priorityLevel: PriorityLevel
  useJito: boolean
  note: string
}

export interface RecordSwapInput {
  ownerAddress: string
  pool: MeteoraPool
  direction: 'xToY' | 'yToX'
  amountIn: number
  amountOut: number
  useJito: boolean
  priorityLevel: PriorityLevel
}
