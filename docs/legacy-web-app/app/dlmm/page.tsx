"use client";
import {
  createOneSidePosition,
  getPositionsState,
} from "@/service/meteora";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export default function Address() {
  const address = `766eFWjVCuDgL3NrA2wsXCuLG1GPvauVu1g8RBNdcCS7`;
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<number>(0);

  // code for the `getAirdropOnClick` function here
  const createBalancePositionClick = async () => {
    try {
      if (!publicKey) {
        throw new Error("Wallet is not Connected");
      }
      const { transaction: balancePositionTx, additionalSigners } =
        await createOneSidePosition(
        connection,
        publicKey,
        address
      );
      // console.log("🚀 ~ balancePositionTx:", balancePositionTx);
      const sigResult = await sendTransaction(balancePositionTx, connection, {
        signers: additionalSigners,
      });
      if (sigResult) {
        alert("createBalancePosition was confirmed!");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("You refused to createBalancePosition");
    }
  };

  // code for the `getBalanceEvery10Seconds` and useEffect code here
  useEffect(() => {
    if (publicKey) {
      (async function getBalanceEvery10Seconds() {
        const newBalance = await connection.getBalance(publicKey);
        setBalance(newBalance / LAMPORTS_PER_SOL);
        await getPositionsState(connection, publicKey, address);
      })();
    }
  }, [publicKey, connection, balance, address]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-evenly p-24">
      {publicKey ? (
        <div className="flex flex-col gap-4">
          <h1>Your Solana Address is: {publicKey?.toString()}</h1>
          <h2>Your Balance is: {balance} SOL</h2>
          <div>
            <button
              onClick={createBalancePositionClick}
              type="button"
              className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
            >
              createBalancePosition
            </button>
          </div>
        </div>
      ) : (
        <h1>Wallet is not connected</h1>
      )}
    </main>
  );
}
