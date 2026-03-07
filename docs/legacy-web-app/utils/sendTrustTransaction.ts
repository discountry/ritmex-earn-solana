import { SendTransactionOptions } from "@solana/wallet-adapter-base";
import {
  Commitment,
  Connection,
  Keypair,
  RpcResponseAndContext,
  SimulateTransactionConfig,
  SimulatedTransactionResponse,
  Transaction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import getProvider from "./getProvider";
import signAndSendTransaction from "./signAndSendTransaction";

const STORAGE_KEY = "ritmex-locale";

function getTransactionSubmittedMessage(): string {
  if (typeof window === "undefined") return "Transaction submitted!";
  const locale = localStorage.getItem(STORAGE_KEY);
  return locale === "en" ? "Transaction submitted!" : "交易已提交!";
}

const SIMULATION_FALLBACK_COMMITMENT: Commitment = "processed";

const toVersionedTransaction = async (
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment
): Promise<VersionedTransaction> => {
  const feePayer = transaction.feePayer;
  if (!feePayer) {
    throw new Error("Transaction is missing a fee payer");
  }

  const recentBlockhash =
    transaction.recentBlockhash ??
    (
      await connection.getLatestBlockhash({
        commitment,
      })
    ).blockhash;

  const legacyMessage = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash,
    instructions: transaction.instructions,
  }).compileToLegacyMessage();

  const versionedTransaction = new VersionedTransaction(legacyMessage);

  return versionedTransaction;
};

const simulateTransactionOrThrow = async (
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  commitment: Commitment
): Promise<void> => {
  const config: SimulateTransactionConfig = {
    commitment,
    sigVerify: false,
  };

  let simulationResult: RpcResponseAndContext<SimulatedTransactionResponse>;
  const transactionForSimulation =
    transaction instanceof VersionedTransaction
      ? transaction
      : await toVersionedTransaction(connection, transaction, commitment);

  try {
    const simulate = connection.simulateTransaction as unknown as (
      this: Connection,
      tx: Transaction | VersionedTransaction,
      simulationConfig?: SimulateTransactionConfig
    ) => Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;

    simulationResult = await simulate.call(
      connection,
      transactionForSimulation,
      config
    );
  } catch (error) {
    throw new Error(
      `Failed to simulate transaction before requesting signature: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (simulationResult.value.err) {
    const logs = simulationResult.value.logs?.join("\n") ?? "No logs available";
    throw new Error(
      `Transaction simulation failed with error: ${JSON.stringify(
        simulationResult.value.err
      )}\nLogs:\n${logs}`
    );
  }
};

export async function sendTrustTransaction(
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  sendTransaction: (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<TransactionSignature>,
  options?: SendTransactionOptions,
  additionalSigners: Keypair[] = []
): Promise<TransactionSignature> {
  const simulationCommitment =
    options?.preflightCommitment ?? SIMULATION_FALLBACK_COMMITMENT;
  await simulateTransactionOrThrow(connection, transaction, simulationCommitment);

  const provider = getProvider();
  if (!provider) {
    const mergedOptions = additionalSigners.length
      ? {
          ...options,
          signers: [
            ...(options?.signers ?? []),
            ...additionalSigners,
          ],
        }
      : options;

    const signature = await sendTransaction(
      transaction,
      connection,
      mergedOptions
    );
    if (signature) {
      alert(getTransactionSubmittedMessage());
    }
    return signature;
  }

  return signAndSendTransaction(
    provider,
    transaction,
    connection,
    options,
    additionalSigners
  );
}
