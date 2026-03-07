import type { SendTransactionOptions } from "@solana/wallet-adapter-base";
import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { PhantomProvider } from "./getProvider";

const SOLANA_TRANSACTION_SIZE_LIMIT = 1232;

const getRawTransaction = (
  transaction: Transaction | VersionedTransaction
): Uint8Array => {
  if (transaction instanceof VersionedTransaction) {
    return transaction.serialize();
  }
  return transaction.serialize();
};

const extractSendOptions = (
  options?: SendTransactionOptions
): SendTransactionOptions | undefined => {
  if (!options) {
    return undefined;
  }

  const {
    skipPreflight,
    preflightCommitment,
    maxRetries,
    minContextSlot,
  } = options;

  return {
    skipPreflight,
    preflightCommitment,
    maxRetries,
    minContextSlot,
  };
};

const signAndSendTransaction = async (
  provider: PhantomProvider,
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  options?: SendTransactionOptions,
  additionalSigners: Keypair[] = []
): Promise<string> => {
  try {
    const signedTransaction = await provider.signTransaction(transaction);

    if (additionalSigners.length > 0) {
      if (signedTransaction instanceof VersionedTransaction) {
        signedTransaction.sign(additionalSigners);
      } else {
        signedTransaction.partialSign(...additionalSigners);
      }
    }

    const rawTransaction = getRawTransaction(signedTransaction);

    if (rawTransaction.length > SOLANA_TRANSACTION_SIZE_LIMIT) {
      throw new Error(
        `Transaction size (${rawTransaction.length} bytes) exceeds Solana's limit of ${SOLANA_TRANSACTION_SIZE_LIMIT} bytes. Please split the transaction or use Address Lookup Tables.`
      );
    }

    const signature = await connection.sendRawTransaction(
      rawTransaction,
      extractSendOptions(options)
    );

    return signature;
  } catch (error) {
    console.warn(error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(String(error));
  }
};

export default signAndSendTransaction;
