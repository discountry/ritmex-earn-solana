import type { DraftPosition, LiquidityMode, MeteoraPool, PriorityLevel } from '@/types/meteora'

const YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000

const priorityMultipliers: Record<PriorityLevel, number> = {
  Low: 1,
  Medium: 1.35,
  High: 1.8,
}

export function getPoolFeePct(pool: MeteoraPool) {
  const fee = pool.dynamic_fee_pct || pool.pool_config.base_fee_pct
  return fee / 100
}

export function estimateLiquidityPreview(
  pool: MeteoraPool,
  amountX: number,
  amountY: number,
  mode: LiquidityMode,
  priorityLevel: PriorityLevel,
  useJito: boolean,
) {
  const depositUsd = amountX * pool.token_x.price + amountY * pool.token_y.price
  const shareOfPool = pool.tvl > 0 ? depositUsd / pool.tvl : 0
  const normalizedApr = Math.max(pool.apr, 0)
  const dailyFeesUsd = depositUsd * (normalizedApr / 365)
  const priorityFeeSol = 0.00005 * priorityMultipliers[priorityLevel]
  const executionQuality = useJito ? 'Jito' : '标准'

  return {
    dailyFeesUsd,
    depositUsd,
    executionQuality,
    priorityFeeSol,
    rangeCoverage: mode === 'Balanced' ? '均衡' : mode === 'Imbalanced' ? '偏置' : '单边',
    shareOfPool,
  }
}

export function estimateSwapPreview(
  pool: MeteoraPool,
  direction: 'xToY' | 'yToX',
  amountIn: number,
  priorityLevel: PriorityLevel,
  useJito: boolean,
) {
  const priceIn = direction === 'xToY' ? pool.token_x.price : pool.token_y.price
  const priceOut = direction === 'xToY' ? pool.token_y.price : pool.token_x.price
  const inputUsd = amountIn * priceIn
  const feePct = getPoolFeePct(pool)
  const priceImpactPct = Math.min((inputUsd / Math.max(pool.tvl, 1)) * 0.35, 0.018)
  const netUsd = inputUsd * (1 - feePct - priceImpactPct)
  const amountOut = priceOut > 0 ? netUsd / priceOut : 0
  const priorityFeeSol = 0.00003 * priorityMultipliers[priorityLevel]

  return {
    amountOut,
    executionLane: useJito ? 'Jito' : '标准',
    feeUsd: inputUsd * feePct,
    inputUsd,
    priceImpactPct,
    priorityFeeSol,
  }
}

export function getAccruedFeesUsd(position: DraftPosition, now = Date.now()) {
  if (position.status !== 'Active') {
    return 0
  }

  const elapsedMs = Math.max(now - position.lastCollectedAt, 0)
  return position.depositUsd * position.apr * (elapsedMs / YEAR_IN_MS)
}

export function getTotalRealizedFeesUsd(position: DraftPosition, now = Date.now()) {
  return position.claimedFeesUsd + getAccruedFeesUsd(position, now)
}
