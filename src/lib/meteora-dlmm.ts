import DLMM, { StrategyType } from '@meteora-ag/dlmm'
import { NATIVE_MINT, getAssociatedTokenAddressSync } from '@solana/spl-token'
import BN from 'bn.js'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, type Transaction } from '@solana/web3.js'

import { fetchPoolByAddress } from '@/lib/meteora-api'
import { addPriorityFee, getSolanaConnection } from '@/lib/solana'
import { decimalToBn, integerToUiAmount, integerToUiAmountString } from '@/lib/token-amounts'
import type { PriceStrategy, PriorityLevel, SwapQuoteView } from '@/types/meteora'

const DEFAULT_SWAP_SLIPPAGE_BPS = new BN(50)
const RANGE_INTERVAL = 34
const SOL_BALANCE_BUFFER_LAMPORTS = new BN(Math.round(0.01 * LAMPORTS_PER_SOL))

const strategyTypeMap: Record<PriceStrategy, StrategyType> = {
  Default: StrategyType.Spot,
  Stable: StrategyType.Curve,
  Volatile: StrategyType.BidAsk,
}

const poolCache = new Map<string, Promise<DLMM>>()

type SwapDirection = 'xToY' | 'yToX'

interface PreparedSwapQuote {
  inputDecimals: number
  outputDecimals: number
  quote: Awaited<ReturnType<DLMM['swapQuote']>>
  swapAmount: BN
  swapYtoX: boolean
  dlmmPool: DLMM
}

interface TokenBalanceCheck {
  amount: BN
  decimals: number
  mint: PublicKey
  symbol: string
}

interface SwapBalanceCheck {
  amount: BN
  direction: SwapDirection
  dlmmPool: DLMM
  owner: PublicKey
  tokenXSymbol: string
  tokenYSymbol: string
}

export interface PreparedLiquidityTransaction {
  additionalSigners: Keypair[]
  positionAddress: string
  transaction: Transaction
}

function getDlmmPool(address: string) {
  const cached = poolCache.get(address)

  if (cached) {
    return cached
  }

  const poolPromise = DLMM.create(getSolanaConnection(), new PublicKey(address))
  poolCache.set(address, poolPromise)
  return poolPromise
}

function getSwapYtoX(direction: SwapDirection) {
  return direction === 'xToY'
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function isMissingTokenAccountError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('could not find account') || message.includes('failed to get token account balance')
}

function isInsufficientFundsError(error: unknown) {
  return getErrorMessage(error).toLowerCase().includes('insufficient funds')
}

function toDisplayAmount(amount: BN, decimals: number, symbol: string) {
  return `${integerToUiAmountString(amount, decimals)} ${symbol}`
}

function getTokenLabel(mint: PublicKey, fallback: string) {
  return mint.equals(NATIVE_MINT) ? 'SOL' : fallback
}

function isDlmmComputeEstimationConsoleError(args: Parameters<typeof console.error>) {
  const [first, second] = args

  if (typeof first !== 'string' || !first.includes('Error::getEstimatedComputeUnitUsageWithBuffer')) {
    return false
  }

  const message = second instanceof Error ? second.message : String(second ?? '')
  return message.includes('Transaction simulation failed')
}

async function withSuppressedDlmmComputeEstimationError<T>(callback: () => Promise<T>) {
  const originalConsoleError = console.error.bind(console)

  console.error = (...args: Parameters<typeof console.error>) => {
    if (isDlmmComputeEstimationConsoleError(args)) {
      return
    }

    originalConsoleError(...args)
  }

  try {
    return await callback()
  } finally {
    console.error = originalConsoleError
  }
}

async function getAvailableAmount(owner: PublicKey, mint: PublicKey) {
  const connection = getSolanaConnection()

  if (mint.equals(NATIVE_MINT)) {
    return new BN(await connection.getBalance(owner, 'confirmed'))
  }

  const ata = getAssociatedTokenAddressSync(mint, owner, false)

  try {
    const balance = await connection.getTokenAccountBalance(ata, 'confirmed')
    return new BN(balance.value.amount)
  } catch (error) {
    if (isMissingTokenAccountError(error)) {
      return new BN(0)
    }

    throw error
  }
}

async function assertSufficientBalance(owner: PublicKey, requirement: TokenBalanceCheck) {
  if (requirement.amount.isZero()) {
    return
  }

  const availableAmount = await getAvailableAmount(owner, requirement.mint)

  if (requirement.mint.equals(NATIVE_MINT)) {
    const requiredLamports = requirement.amount.add(SOL_BALANCE_BUFFER_LAMPORTS)

    if (availableAmount.lt(requiredLamports)) {
      throw new Error(
        `Insufficient ${requirement.symbol} balance. Need ${toDisplayAmount(
          requirement.amount,
          requirement.decimals,
          requirement.symbol,
        )} plus about ${toDisplayAmount(
          SOL_BALANCE_BUFFER_LAMPORTS,
          requirement.decimals,
          requirement.symbol,
        )} for rent and fees, but only ${toDisplayAmount(
          availableAmount,
          requirement.decimals,
          requirement.symbol,
        )} is available.`,
      )
    }

    return
  }

  if (availableAmount.lt(requirement.amount)) {
    throw new Error(
      `Insufficient ${requirement.symbol} balance. Need ${toDisplayAmount(
        requirement.amount,
        requirement.decimals,
        requirement.symbol,
      )}, but the associated token account only has ${toDisplayAmount(
        availableAmount,
        requirement.decimals,
        requirement.symbol,
      )}.`,
    )
  }
}

async function assertSufficientLiquidityBalances(options: {
  dlmmPool: DLMM
  owner: PublicKey
  tokenXSymbol: string
  tokenYSymbol: string
  totalXAmount: BN
  totalYAmount: BN
}) {
  const { dlmmPool, owner, tokenXSymbol, tokenYSymbol, totalXAmount, totalYAmount } = options

  await Promise.all([
    assertSufficientBalance(owner, {
      amount: totalXAmount,
      decimals: dlmmPool.tokenX.mint.decimals,
      mint: dlmmPool.tokenX.publicKey,
      symbol: getTokenLabel(dlmmPool.tokenX.publicKey, tokenXSymbol),
    }),
    assertSufficientBalance(owner, {
      amount: totalYAmount,
      decimals: dlmmPool.tokenY.mint.decimals,
      mint: dlmmPool.tokenY.publicKey,
      symbol: getTokenLabel(dlmmPool.tokenY.publicKey, tokenYSymbol),
    }),
  ])
}

async function assertSufficientSwapBalance(options: SwapBalanceCheck) {
  const { amount, direction, dlmmPool, owner, tokenXSymbol, tokenYSymbol } = options

  const inputToken = direction === 'xToY' ? dlmmPool.tokenX : dlmmPool.tokenY
  const outputToken = direction === 'xToY' ? dlmmPool.tokenY : dlmmPool.tokenX
  const inputSymbol = getTokenLabel(inputToken.publicKey, direction === 'xToY' ? tokenXSymbol : tokenYSymbol)
  const outputSymbol = getTokenLabel(outputToken.publicKey, direction === 'xToY' ? tokenYSymbol : tokenXSymbol)

  await assertSufficientBalance(owner, {
    amount,
    decimals: inputToken.mint.decimals,
    mint: inputToken.publicKey,
    symbol: inputSymbol,
  })

  if (inputToken.publicKey.equals(NATIVE_MINT)) {
    return
  }

  const availableSol = await getAvailableAmount(owner, NATIVE_MINT)

  if (availableSol.lt(SOL_BALANCE_BUFFER_LAMPORTS)) {
    throw new Error(
      `Not enough SOL to pay swap fees and token account rent. Keep about ${toDisplayAmount(
        SOL_BALANCE_BUFFER_LAMPORTS,
        9,
        'SOL',
      )} in the wallet before swapping ${inputSymbol} to ${outputSymbol}.`,
    )
  }
}

function normalizeLiquidityBuildError(error: unknown) {
  if (isInsufficientFundsError(error)) {
    return new Error(
      'Insufficient wallet balance for this liquidity deposit. Reduce one side or top up the missing token.',
    )
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(String(error))
}

function toSwapQuoteView(
  quote: PreparedSwapQuote['quote'],
  inputDecimals: number,
  outputDecimals: number,
): SwapQuoteView {
  return {
    amountOut: integerToUiAmount(quote.outAmount, outputDecimals),
    feeAmount: integerToUiAmount(quote.fee, inputDecimals),
    minAmountOut: integerToUiAmount(quote.minOutAmount, outputDecimals),
    priceImpactPct: Number(quote.priceImpact.toString()),
  }
}

function getPositionRange(activeBinId: number, totalXAmount: BN, totalYAmount: BN) {
  if (totalXAmount.isZero() && totalYAmount.gt(new BN(0))) {
    return {
      maxBinId: activeBinId,
      minBinId: activeBinId - RANGE_INTERVAL * 2,
    }
  }

  if (totalYAmount.isZero() && totalXAmount.gt(new BN(0))) {
    return {
      maxBinId: activeBinId + RANGE_INTERVAL * 2,
      minBinId: activeBinId,
    }
  }

  return {
    maxBinId: activeBinId + RANGE_INTERVAL,
    minBinId: activeBinId - RANGE_INTERVAL,
  }
}

async function prepareSwapQuote(options: {
  amountIn: string
  direction: SwapDirection
  poolAddress: string
}): Promise<PreparedSwapQuote> {
  const { amountIn, direction, poolAddress } = options
  const dlmmPool = await getDlmmPool(poolAddress)
  const swapYtoX = getSwapYtoX(direction)
  const inputDecimals = swapYtoX ? dlmmPool.tokenX.mint.decimals : dlmmPool.tokenY.mint.decimals
  const outputDecimals = swapYtoX ? dlmmPool.tokenY.mint.decimals : dlmmPool.tokenX.mint.decimals
  const swapAmount = decimalToBn(amountIn, inputDecimals)
  const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX)
  const quote = await dlmmPool.swapQuote(swapAmount, swapYtoX, DEFAULT_SWAP_SLIPPAGE_BPS, binArrays)

  return {
    dlmmPool,
    inputDecimals,
    outputDecimals,
    quote,
    swapAmount,
    swapYtoX,
  }
}

export async function fetchSwapQuote(options: {
  amountIn: string
  direction: SwapDirection
  poolAddress: string
}): Promise<SwapQuoteView> {
  const { inputDecimals, outputDecimals, quote } = await prepareSwapQuote(options)
  return toSwapQuoteView(quote, inputDecimals, outputDecimals)
}

export async function buildSwapTransaction(options: {
  amountIn: string
  direction: SwapDirection
  owner: string
  poolAddress: string
  priorityLevel: PriorityLevel
  tokenXSymbol: string
  tokenYSymbol: string
}) {
  const { owner, priorityLevel } = options
  const { dlmmPool, inputDecimals, outputDecimals, quote, swapAmount, swapYtoX } = await prepareSwapQuote(options)
  const ownerKey = new PublicKey(owner)

  await assertSufficientSwapBalance({
    amount: swapAmount,
    direction: options.direction,
    dlmmPool,
    owner: ownerKey,
    tokenXSymbol: options.tokenXSymbol,
    tokenYSymbol: options.tokenYSymbol,
  })

  const transaction = await withSuppressedDlmmComputeEstimationError(() =>
    dlmmPool.swap({
      binArraysPubkey: quote.binArraysPubkey,
      inAmount: swapAmount,
      inToken: swapYtoX ? dlmmPool.tokenX.publicKey : dlmmPool.tokenY.publicKey,
      lbPair: dlmmPool.pubkey,
      minOutAmount: quote.minOutAmount,
      outToken: swapYtoX ? dlmmPool.tokenY.publicKey : dlmmPool.tokenX.publicKey,
      user: ownerKey,
    }),
  )

  await addPriorityFee(transaction, priorityLevel)

  return {
    quote: toSwapQuoteView(quote, inputDecimals, outputDecimals),
    transaction,
  }
}

export async function buildAddLiquidityTransaction(options: {
  amountX: string
  amountY: string
  owner: string
  poolAddress: string
  priorityLevel: PriorityLevel
  strategy: PriceStrategy
  tokenXSymbol: string
  tokenYSymbol: string
}): Promise<PreparedLiquidityTransaction> {
  const { amountX, amountY, owner, poolAddress, priorityLevel, strategy, tokenXSymbol, tokenYSymbol } = options
  const ownerKey = new PublicKey(owner)
  const dlmmPool = await getDlmmPool(poolAddress)
  const totalXAmount = decimalToBn(amountX, dlmmPool.tokenX.mint.decimals)
  const totalYAmount = decimalToBn(amountY, dlmmPool.tokenY.mint.decimals)

  if (totalXAmount.isZero() && totalYAmount.isZero()) {
    throw new Error('Enter a token amount before sending the transaction')
  }

  await assertSufficientLiquidityBalances({
    dlmmPool,
    owner: ownerKey,
    tokenXSymbol,
    tokenYSymbol,
    totalXAmount,
    totalYAmount,
  })

  try {
    const activeBin = await dlmmPool.getActiveBin()
    const { minBinId, maxBinId } = getPositionRange(activeBin.binId, totalXAmount, totalYAmount)
    const positionKeypair = Keypair.generate()

    const transaction = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: positionKeypair.publicKey,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: strategyTypeMap[strategy],
      },
      totalXAmount,
      totalYAmount,
      user: ownerKey,
    })

    await addPriorityFee(transaction, priorityLevel)

    return {
      additionalSigners: [positionKeypair],
      positionAddress: positionKeypair.publicKey.toBase58(),
      transaction,
    }
  } catch (error) {
    throw normalizeLiquidityBuildError(error)
  }
}

export async function fetchPoolName(poolAddress: string) {
  const { pool } = await fetchPoolByAddress(poolAddress)
  return pool?.name ?? `Pool ${poolAddress.slice(0, 4)}...${poolAddress.slice(-4)}`
}
