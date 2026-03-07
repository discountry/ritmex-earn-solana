import { Connection, PublicKey } from "@solana/web3.js";
import { useState, useEffect } from "react";

export const useBalance = ({
  connection,
  publicKey,
}: {
  connection: Connection | undefined;
  publicKey: PublicKey | undefined;
}) => {
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (connection && publicKey) {
      const fetchBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      };

      fetchBalance();

      const autoUpdate = connection.onAccountChange(publicKey, () => {
        fetchBalance();
      });

      const intervalId = setInterval(fetchBalance, 10000);

      return () => {
        connection.removeAccountChangeListener(autoUpdate);
        clearInterval(intervalId);
      };
    }
  }, [connection, publicKey]);

  return balance;
};
