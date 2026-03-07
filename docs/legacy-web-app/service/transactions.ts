import { HELIUS_RPC } from "@/config/solana";
import { Priority } from "@/store/globalStore";
import { isVersionedTransaction } from "@solana/wallet-adapter-base";
import {
  Transaction,
  Connection,
  VersionedTransaction,
  PublicKey,
  AddressLookupTableAccount,
} from "@solana/web3.js";
import bs58 from "bs58";

// Helper function to get the writable accounts from a transaction
export const getWritableAccounts = async (
  connection: Connection,
  transaction: Transaction | VersionedTransaction
): Promise<PublicKey[]> => {
  if (isVersionedTransaction(transaction)) {
    const luts = (
      await Promise.all(
        transaction.message.addressTableLookups.map((acc) =>
          connection.getAddressLookupTable(acc.accountKey)
        )
      )
    )
      .map((lut) => lut.value)
      .filter((val) => val !== null) as AddressLookupTableAccount[];
    const msg = transaction.message;
    const keys = msg.getAccountKeys({
      addressLookupTableAccounts: luts ?? undefined,
    });
    return msg.compiledInstructions
      .flatMap((ix) => ix.accountKeyIndexes)
      .map((k) => (msg.isAccountWritable(k) ? keys.get(k) : null))
      .filter(Boolean) as PublicKey[];
  } else {
    return transaction.instructions
      .flatMap((ix) => ix.keys)
      .map((k) => (k.isWritable ? k.pubkey : null))
      .filter(Boolean) as PublicKey[];
  }
};

export const calculatePriorityFee = async (
  transaction: Transaction,
  connection: Connection
) => {
  // Figure out which accounts need write lock
  const lockedWritableAccounts = await getWritableAccounts(
    connection,
    transaction
  );
  // console.log("Locked writable accounts:", lockedWritableAccounts);
  // 获取当前网络的优先费用估算
  const recentFees = await connection.getRecentPrioritizationFees({
    lockedWritableAccounts,
  });

  if (recentFees.length === 0) {
    return 0;
  }
  const totalFees = recentFees.reduce(
    (sum, fee) => sum + fee.prioritizationFee,
    0
  );
  const averageFee = Math.ceil((totalFees / recentFees.length) * 1.2);

  //   console.log("Average fee:", averageFee);

  return Math.min(averageFee, 200000);
};

export async function getPriorityFeeEstimate(
  transaction: Transaction,
  priorityLevel: Priority = "Medium"
) {
  const response = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method: "getPriorityFeeEstimate",
      params: [
        {
          transaction: bs58.encode(
            transaction.serialize({
              requireAllSignatures: false,
            })
          ), // Pass the serialized transaction in Base58
          options: { priorityLevel: priorityLevel },
        },
      ],
    }),
  });
  const data = await response.json();
  console.log(
    "Fee in function for",
    priorityLevel,
    " :",
    data.result.priorityFeeEstimate
  );
  return data.result.priorityFeeEstimate;
}
