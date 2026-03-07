"use client";

import { Balance, swap, swapEmulate } from "@/service/meteora";
import { converLamportsToDecimal } from "@/utils/formatter";
import { sendTrustTransaction } from "@/utils/sendTrustTransaction";
import { Button, Checkbox, Field, Label } from "@headlessui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowDown,
  ArrowUp,
  CheckIcon,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useGlobalStore } from "./providers/StoreProvider";
import { Transaction } from "@solana/web3.js";
import { createBundle, sendBundle } from "@/service/jito";
import { useLocale } from "@/i18n/LocaleProvider";

interface SwapCardProps {
  tokenX: string;
  tokenXBalance: Balance;
  tokenY: string;
  tokenYBalance: Balance;
  getBalances: () => Promise<void>;
}

export default function SwapCard({
  tokenX,
  tokenXBalance,
  tokenY,
  tokenYBalance,
  getBalances,
}: SwapCardProps) {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const { priorityLevel } = useGlobalStore((state) => state);
  const { t } = useLocale();

  const [swapAmountX, setSwapAmountX] = useState("0");
  const [swapAmountY, setSwapAmountY] = useState("0");
  const [swapYtoX, setSwapYtoX] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const [enableMEV, setEnableMEV] = useState(true);

  const confirmSwapClick = async () => {
    if (!publicKey) {
      alert(t.swap.connectWalletFirst);
      return;
    }

    if (Number(swapAmountX) === 0 || Number(swapAmountY) === 0) {
      alert(t.swap.invalidSwapAmount);
      return;
    }

    setIsLoading(true);

    try {
      const swapTx = await swap(
        connection,
        publicKey,
        address,
        swapYtoX
          ? Number(swapAmountX) * tokenXBalance.lamports
          : Number(swapAmountY) * tokenYBalance.lamports,
        swapYtoX,
        priorityLevel
      );
      if (enableMEV) {
        await handleSendJitoBundle(swapTx);
      } else {
        await handleSendTransaction(swapTx);
      }
      setTimeout(() => {
        getBalances();
      }, 1000 * 10);
      setTimeout(() => {
        getBalances();
      }, 1000 * 30);
    } catch (error) {
      console.error(error);
    }

    setIsLoading(false);
  };

  const handleSendTransaction = async (tx: Transaction) => {
    try {
      await sendTrustTransaction(tx, connection, sendTransaction);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendJitoBundle = async (tx: Transaction) => {
    if (connection && publicKey && signTransaction) {
      const bundleTx = await createBundle(tx, connection, publicKey);
      const signedTx = await signTransaction(bundleTx);
      const result = await sendBundle(signedTx);
      console.log("Bundle result:", result);
    }
  };

  useEffect(() => {
    if (
      swapYtoX &&
      Number(swapAmountX) > 0 &&
      tokenXBalance.lamports > 0 &&
      tokenYBalance.lamports > 0
    ) {
      async function emulateSwap() {
        const swapResult = await swapEmulate(
          connection,
          address,
          Number(swapAmountX) * tokenXBalance.lamports,
          swapYtoX
        );

        const displayAmount = (
          Number(swapResult.outAmount) / tokenYBalance.lamports
        ).toFixed(converLamportsToDecimal(tokenYBalance.lamports));

        setSwapAmountY(displayAmount);
      }
      emulateSwap();
    }
  }, [swapAmountX, swapYtoX, tokenXBalance.lamports, tokenYBalance.lamports]);

  useEffect(() => {
    if (
      !swapYtoX &&
      Number(swapAmountY) > 0 &&
      tokenXBalance.lamports > 0 &&
      tokenYBalance.lamports > 0
    ) {
      async function emulateSwap() {
        const swapResult = await swapEmulate(
          connection,
          address,
          Number(swapAmountY) * tokenYBalance.lamports,
          swapYtoX
        );

        const displayAmount = (
          Number(swapResult.outAmount) / tokenXBalance.lamports
        ).toFixed(converLamportsToDecimal(tokenXBalance.lamports));

        setSwapAmountX(displayAmount);
      }
      emulateSwap();
    }
  }, [swapAmountY, swapYtoX, tokenXBalance.lamports, tokenYBalance.lamports]);

  useEffect(() => {
    setSwapAmountX("");
    setSwapAmountY("");
  }, [swapYtoX]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg px-6 py-4">
      <h1 className="mb-3 flex justify-between items-center">
        <span className="text-xl font-semibold ">{t.swap.title}</span>
        <Field className="flex items-center gap-2">
          <Label
            className="text-sm flex items-center"
            title={t.swap.mevProtection}
          >
            <ShieldCheck size={16} className="text-lime-400" />
            <span>MEV</span>
          </Label>
          <Checkbox
            checked={enableMEV}
            onChange={setEnableMEV}
            className="group size-6 rounded-md bg-white/10 p-1 ring-1 ring-white/15 ring-inset data-[checked]:bg-gray-800/50"
          >
            <CheckIcon className="hidden size-4 group-data-[checked]:block" />
          </Checkbox>
        </Field>
      </h1>
      {/* Input Fields */}
      <div className="flex flex-col w-full justify-center items-center space-y-2">
        <div className="border border-gray-400/50 p-4 rounded-lg w-full basis-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-300">
              {t.swap.amount.replace("{token}", tokenX)}
            </label>
            <div className="text-sm text-gray-400 flex justify-center items-center gap-1">
              {tokenXBalance.amount} {tokenX}
              <Wallet width={16} height={16} />
            </div>
          </div>
          <div className="flex space-x-2">
            <input
              disabled={!swapYtoX}
              type="number"
              value={swapAmountX}
              onChange={(e) => {
                const value = e.target.value;
                let sanitizedValue = value.replace(/^0+/, "");
                if (sanitizedValue === "") {
                  sanitizedValue = "0";
                } else if (
                  sanitizedValue !== "0" &&
                  value !== "0" &&
                  !value.includes(".")
                ) {
                  sanitizedValue = sanitizedValue.replace(/^0+/, "");
                }

                if (value.includes(".")) {
                  const parts = value.split(".");
                  if (parts[0] === "0") {
                    sanitizedValue = "0." + parts.slice(1).join(".");
                  } else {
                    sanitizedValue =
                      parts[0].replace(/^0+/, "") +
                      "." +
                      parts.slice(1).join(".");
                  }
                }

                const numberValue =
                  sanitizedValue !== "" ? Number(sanitizedValue) : 0;

                if (tokenX === "SOL") {
                  if (numberValue > tokenXBalance.amount - 0.1) {
                    setSwapAmountX(String(tokenXBalance.amount - 0.1));
                  } else {
                    setSwapAmountX(sanitizedValue);
                  }
                } else {
                  if (numberValue > tokenXBalance.amount) {
                    setSwapAmountX(String(tokenXBalance.amount));
                  } else {
                    setSwapAmountX(sanitizedValue);
                  }
                }
              }}
              className={`flex-1 rounded-lg bg-gray-900/50 backdrop-blur-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-white ${
                !swapYtoX ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="0.0"
            />
            <button
              disabled={!swapYtoX}
              onClick={() =>
                setSwapAmountX(
                  String(
                    tokenX === "SOL"
                      ? (tokenXBalance.amount - 0.1).toFixed(
                          tokenXBalance.decimals
                        )
                      : tokenXBalance.amount.toFixed(tokenXBalance.decimals)
                  )
                )
              }
              className={`px-4 py-2 border border-gray-500 hover:border-gray-300 rounded-lg text-xs xl:text-sm font-medium text-white ${
                !swapYtoX ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {t.swap.max}
            </button>
          </div>
        </div>
        <Button
          className="border border-gray-400 rounded-lg p-2"
          onClick={() => setSwapYtoX(!swapYtoX)}
        >
          {swapYtoX ? <ArrowDown /> : <ArrowUp />}
        </Button>
        <div className="border border-gray-400/50 p-4 rounded-lg w-full basis-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-300">
              {t.swap.amount.replace("{token}", tokenY)}
            </label>
            <div className="text-sm text-gray-400 flex justify-center items-center gap-1">
              {tokenYBalance.amount} {tokenY}
              <Wallet width={16} height={16} />
            </div>
          </div>
          <div className="flex space-x-2">
            <input
              disabled={swapYtoX}
              type="number"
              value={swapAmountY}
              onChange={(e) => {
                const value = e.target.value;
                let sanitizedValue = value.replace(/^0+/, "");
                if (sanitizedValue === "") {
                  sanitizedValue = "0";
                } else if (
                  sanitizedValue !== "0" &&
                  value !== "0" &&
                  !value.includes(".")
                ) {
                  sanitizedValue = sanitizedValue.replace(/^0+/, "");
                }

                if (value.includes(".")) {
                  const parts = value.split(".");
                  if (parts[0] === "0") {
                    sanitizedValue = "0." + parts.slice(1).join(".");
                  } else {
                    sanitizedValue =
                      parts[0].replace(/^0+/, "") +
                      "." +
                      parts.slice(1).join(".");
                  }
                }

                const numberValue =
                  sanitizedValue !== "" ? Number(sanitizedValue) : 0;

                if (tokenY === "SOL") {
                  if (numberValue > tokenYBalance.amount - 0.1) {
                    setSwapAmountY(String(tokenYBalance.amount - 0.1));
                  } else {
                    setSwapAmountY(sanitizedValue);
                  }
                } else {
                  if (numberValue > tokenYBalance.amount) {
                    setSwapAmountY(String(tokenYBalance.amount));
                  } else {
                    setSwapAmountY(sanitizedValue);
                  }
                }
              }}
              className={`flex-1 rounded-lg bg-gray-900/50 backdrop-blur-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-white ${
                swapYtoX ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="0.0"
            />
            <button
              disabled={swapYtoX}
              onClick={() =>
                setSwapAmountY(
                  tokenY === "SOL"
                    ? (tokenYBalance.amount - 0.1).toFixed(
                        tokenYBalance.decimals
                      )
                    : tokenYBalance.amount.toFixed(tokenYBalance.decimals)
                )
              }
              className={`px-4 py-2 border border-gray-500 hover:border-gray-300 rounded-lg text-xs xl:text-sm font-medium text-white ${
                swapYtoX ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {t.swap.max}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        disabled={isLoading}
        className="w-full mt-3 bg-blue-900/70 hover:bg-blue-700/70 backdrop-blur-md text-white font-medium py-3 px-4 rounded-lg transition-colors"
        onClick={() => {
          confirmSwapClick();
        }}
      >
        {isLoading ? t.swap.processing : t.swap.confirmSwap}
      </button>
      {/*interaction notice */}
      <p className="text-xs xl:text-sm text-lime-400 mt-2">
        {t.swap.securityNotice}
      </p>
      <p className="text-xs xl:text-sm text-gray-400 mt-2">
        {t.swap.feeNotice.split("{amount}")[0]}
        <strong> 0.001 </strong>
        {t.swap.feeNotice.split("{amount}")[1]}
      </p>
    </div>
  );
}
