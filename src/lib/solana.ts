import { Buffer } from 'buffer'
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  type Keypair,
  type SendOptions,
} from '@solana/web3.js'

import type { PriorityLevel } from '@/types/meteora'

const MAINNET_RPC_URL = 'https://api.mainnet-beta.solana.com'
const MAX_PRIORITY_FEE_MICROLAMPORTS = 200_000

const priorityMultiplier: Record<PriorityLevel, number> = {
  High: 1.7,
  Low: 0.8,
  Medium: 1.2,
}

const priorityFloorMicrolamports: Record<PriorityLevel, number> = {
  High: 80_000,
  Low: 10_000,
  Medium: 30_000,
}

const connection = new Connection(MAINNET_RPC_URL, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60_000,
})

export interface SigningMobileWallet {
  signTransactions(params: { payloads: string[] }): Promise<{ signed_payloads: string[] }>
}

export type WalletTransactor = <T>(callback: (wallet: SigningMobileWallet) => Promise<T>) => Promise<T>

function getLegacyWritableAccounts(transaction: Transaction) {
  const writable = new Map<string, PublicKey>()

  transaction.instructions
    .flatMap((instruction) => instruction.keys)
    .filter((account) => account.isWritable)
    .forEach((account) => {
      writable.set(account.pubkey.toBase58(), account.pubkey)
    })

  return [...writable.values()]
}

function getPriorityFeeSample(fees: number[]) {
  if (fees.length === 0) {
    return 0
  }

  const sorted = [...fees].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))
  return sorted[index]
}

export function getSolanaConnection() {
  return connection
}

export async function addPriorityFee(transaction: Transaction, priorityLevel: PriorityLevel) {
  const writableAccounts = getLegacyWritableAccounts(transaction)
  const recentFees = await connection.getRecentPrioritizationFees(
    writableAccounts.length > 0 ? { lockedWritableAccounts: writableAccounts } : undefined,
  )

  const baseFee = getPriorityFeeSample(recentFees.map((item) => item.prioritizationFee))
  const computedFee = Math.ceil(baseFee * priorityMultiplier[priorityLevel])
  const microLamports = Math.min(
    Math.max(computedFee, priorityFloorMicrolamports[priorityLevel]),
    MAX_PRIORITY_FEE_MICROLAMPORTS,
  )

  transaction.instructions.unshift(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports,
    }),
  )
}

function getSignedTransactionPayload(transaction: Transaction) {
  return transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  })
}

function extractErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.toLowerCase().includes('insufficient funds')) {
    return 'Insufficient wallet balance for this transaction.'
  }

  return message
}

export async function signAndSendTransactions(options: {
  additionalSigners?: Keypair[][]
  owner: PublicKey
  sendOptions?: SendOptions
  transactions: Transaction[]
  walletTransactor: WalletTransactor
}) {
  const { additionalSigners = [], owner, sendOptions, transactions, walletTransactor } = options

  return walletTransactor(async (wallet) => {
    if (typeof wallet.signTransactions !== 'function') {
      throw new Error('The selected mobile wallet does not support transaction signing')
    }

    const signatures: string[] = []

    for (const [index, transaction] of transactions.entries()) {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

      transaction.feePayer = owner
      transaction.recentBlockhash = blockhash

      for (const signer of additionalSigners[index] ?? []) {
        transaction.partialSign(signer)
      }

      const serialized = getSignedTransactionPayload(transaction).toString('base64')
      const signedPayloads = await wallet.signTransactions({
        payloads: [serialized],
      })

      const signedTransaction = Transaction.from(Buffer.from(signedPayloads.signed_payloads[0], 'base64'))
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        maxRetries: 3,
        preflightCommitment: 'confirmed',
        skipPreflight: false,
        ...sendOptions,
      })

      const confirmation = await connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature,
        },
        'confirmed',
      )

      if (confirmation.value.err) {
        throw new Error(`Transaction confirmation failed: ${JSON.stringify(confirmation.value.err)}`)
      }

      signatures.push(signature)
    }

    return signatures
  }).catch((error) => {
    throw new Error(extractErrorMessage(error))
  })
}
