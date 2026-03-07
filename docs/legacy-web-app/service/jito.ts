import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { JitoJsonRpcClient } from "jito-js-rpc";
import bs58 from "bs58";
import { fetchData } from "@/utils/helper";

export const jitoClient = new JitoJsonRpcClient(
  "https://mainnet.block-engine.jito.wtf/api/v1",
  ""
);

export const createBundle = async (
  transaction: Transaction,
  connection: Connection,
  publicKey: PublicKey
) => {
  const randomTipAccount = await jitoClient.getRandomTipAccount();
  const jitoTip = await fetchData(`/api/tip`);

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: new PublicKey(randomTipAccount),
      lamports: jitoTip.tips,
    })
  );

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = publicKey;

  return transaction;
};

export const sendBundle = async (transaction: Transaction) => {
  // Serialize and base58 encode the entire signed transaction
  const serializedTransaction = transaction.serialize({
    verifySignatures: false,
  });
  const base58EncodedTransaction = bs58.encode(serializedTransaction);
  // Send the bundle using sendBundle method
  const result = await jitoClient.sendBundle([[base58EncodedTransaction]]);

  const bundleId = result.result;

  // Wait for confirmation with a longer timeout
  const inflightStatus = await jitoClient.confirmInflightBundle(
    bundleId,
    120000
  ); // 120 seconds timeout
  console.log(
    "Inflight bundle status:",
    JSON.stringify(inflightStatus, null, 2)
  );

  const explorerUrl = `https://explorer.jito.wtf/bundle/${bundleId}`;
  console.log("Bundle Explorer URL:", explorerUrl);

  return {
    bundleId,
    explorerUrl,
  };
};
