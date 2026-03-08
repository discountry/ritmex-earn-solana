import type { DraftPosition } from '@/types/meteora'

const compactFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const compactCurrencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
})

const preciseFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 4,
})

const percentFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  maximumFractionDigits: 2,
})

export function formatCompactNumber(value: number) {
  return compactFormatter.format(value)
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value)
}

export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function formatTokenAmount(value: number) {
  return preciseFormatter.format(value)
}

export function formatPercentage(value: number) {
  return percentFormatter.format(value)
}

export function shortAddress(value: string) {
  if (value.length <= 12) {
    return value
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

export function formatTimeAgo(timestamp: number) {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000)

  if (diffMinutes < 1) {
    return '刚刚'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} 小时前`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} 天前`
}

export function formatPositionLabel(position: DraftPosition) {
  return `${position.tokenXSymbol}/${position.tokenYSymbol} · ${position.mode}`
}
