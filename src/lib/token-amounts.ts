import BN from 'bn.js'

function getNormalizedIntegerString(value: BN | bigint | number | string) {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return Math.trunc(value).toString()
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  return value.toString(10)
}

export function decimalToBn(value: string, decimals: number) {
  const sanitized = value.trim().replace(',', '.')

  if (!/^\d*\.?\d*$/.test(sanitized)) {
    throw new Error('Invalid token amount')
  }

  const [wholePart = '0', fractionalPart = ''] = sanitized.split('.')
  const whole = wholePart.replace(/^0+(?=\d)/, '') || '0'
  const fraction = `${fractionalPart}${'0'.repeat(decimals)}`.slice(0, decimals)
  const combined = `${whole}${fraction}`.replace(/^0+(?=\d)/, '') || '0'

  return new BN(combined, 10)
}

export function integerToUiAmountString(value: BN | bigint | number | string, decimals: number) {
  const isNegative =
    (typeof value === 'string' && value.startsWith('-')) ||
    (typeof value === 'number' && value < 0) ||
    (typeof value === 'bigint' && value < 0n)

  const absolute = getNormalizedIntegerString(value).replace('-', '')
  const padded = absolute.padStart(decimals + 1, '0')
  const whole = padded.slice(0, padded.length - decimals)
  const fraction = padded.slice(padded.length - decimals).replace(/0+$/, '')
  const prefix = isNegative ? '-' : ''

  return fraction ? `${prefix}${whole}.${fraction}` : `${prefix}${whole}`
}

export function integerToUiAmount(value: BN | bigint | number | string, decimals: number) {
  return Number(integerToUiAmountString(value, decimals))
}
