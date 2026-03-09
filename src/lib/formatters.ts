import type { DraftPosition, LiquidityMode, PriceStrategy, PriorityLevel } from '@/types/meteora'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const preciseFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 4,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
})

export function formatCompactNumber(value: number) {
  const absoluteValue = Math.abs(value)

  if (absoluteValue >= 1_000_000_000) {
    return `${formatNumber(value / 1_000_000_000)}B`
  }

  if (absoluteValue >= 1_000_000) {
    return `${formatNumber(value / 1_000_000)}M`
  }

  if (absoluteValue >= 1_000) {
    return `${formatNumber(value / 1_000)}K`
  }

  return formatNumber(value)
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCompactCurrency(value: number) {
  const absoluteValue = Math.abs(value)
  const prefix = value < 0 ? '-$' : '$'

  if (absoluteValue >= 1_000_000_000) {
    return `${prefix}${formatNumber(absoluteValue / 1_000_000_000)}B`
  }

  if (absoluteValue >= 1_000_000) {
    return `${prefix}${formatNumber(absoluteValue / 1_000_000)}M`
  }

  if (absoluteValue >= 1_000) {
    return `${prefix}${formatNumber(absoluteValue / 1_000)}K`
  }

  return formatCurrency(value)
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
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function formatModeLabel(mode: LiquidityMode) {
  switch (mode) {
    case 'Balanced':
      return 'Balanced'
    case 'Imbalanced':
      return 'Custom'
    case 'One-Sided':
      return 'One-sided'
  }
}

export function formatStrategyLabel(strategy: PriceStrategy) {
  switch (strategy) {
    case 'Default':
      return 'Default'
    case 'Stable':
      return 'Stable'
    case 'Volatile':
      return 'Volatile'
  }
}

export function formatPriorityLabel(priority: PriorityLevel) {
  switch (priority) {
    case 'Low':
      return 'Low'
    case 'Medium':
      return 'Medium'
    case 'High':
      return 'High'
  }
}

export function formatPositionLabel(position: DraftPosition) {
  return `${position.tokenXSymbol}/${position.tokenYSymbol} · ${formatModeLabel(position.mode)}`
}
