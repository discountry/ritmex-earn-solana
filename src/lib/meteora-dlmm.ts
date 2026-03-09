import DLMM, { StrategyType } from '@meteora-ag/dlmm'
import BN from 'bn.js'
import { Keypair, PublicKey, type Transaction } from '@solana/web3.js'

import { fetchPoolByAddress } from '@/lib/meteora-api'
import { addPriorityFee, getSolanaConnection } from '@/lib/solana'
import { decimalToBn, integerToUiAmount } from '@/lib/token-amounts'
import type { PriceStrategy, PriorityLevel, SwapQuoteView } from '@/types/meteora'

const DEFAULT_SWAP_SLIPPAGE_BPS = new BN(50)
const RANGE_INTERVAL = 34

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
}) {
  const { owner, priorityLevel } = options
  const { dlmmPool, inputDecimals, outputDecimals, quote, swapAmount, swapYtoX } = await prepareSwapQuote(options)
  const ownerKey = new PublicKey(owner)

  const transaction = await dlmmPool.swap({
    binArraysPubkey: quote.binArraysPubkey,
    inAmount: swapAmount,
    inToken: swapYtoX ? dlmmPool.tokenX.publicKey : dlmmPool.tokenY.publicKey,
    lbPair: dlmmPool.pubkey,
    minOutAmount: quote.minOutAmount,
    outToken: swapYtoX ? dlmmPool.tokenY.publicKey : dlmmPool.tokenX.publicKey,
    user: ownerKey,
  })

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
}): Promise<PreparedLiquidityTransaction> {
  const { amountX, amountY, owner, poolAddress, priorityLevel, strategy } = options
  const ownerKey = new PublicKey(owner)
  const dlmmPool = await getDlmmPool(poolAddress)
  const totalXAmount = decimalToBn(amountX, dlmmPool.tokenX.mint.decimals)
  const totalYAmount = decimalToBn(amountY, dlmmPool.tokenY.mint.decimals)

  if (totalXAmount.isZero() && totalYAmount.isZero()) {
    throw new Error('Enter a token amount before sending the transaction')
  }

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
}

export async function fetchPoolName(poolAddress: string) {
  const { pool } = await fetchPoolByAddress(poolAddress)
  return pool?.name ?? `Pool ${poolAddress.slice(0, 4)}...${poolAddress.slice(-4)}`
}
