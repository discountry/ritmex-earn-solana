"use client";
import {
  Balance,
  createImbalancePosition,
  getBinInfo,
  getPositionsState,
  PositionMode,
  removePositionLiquidity,
} from "@/service/meteora";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchData } from "@/utils/helper";
import { Pool } from "@/utils/filter";
import {
  Description,
  Label,
  Radio,
  Switch,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import { RadioGroup } from "@headlessui/react";
import {
  getAssociatedTokenAddress,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { useGlobalStore } from "@/app/components/providers/StoreProvider";
import { converLamportsToDecimal, formatUSD } from "@/utils/formatter";
import KlineChart from "@/app/components/KlineChart";
import NavBar from "@/app/components/NavBar";
import { LbPosition } from "@meteora-ag/dlmm";
import { sendTrustTransaction } from "@/utils/sendTrustTransaction";
import PoolTopBar from "@/app/components/PoolTopBar";
import SwapCard from "@/app/components/SwapCard";
import { Wallet } from "lucide-react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useBalance } from "@/hooks/useBalance";
import { SOL_CONTRACT } from "@/config/solana";
import PrioritySelect from "@/app/components/PrioritySelect";
import PositionCard from "@/app/components/PositionCard";
import { useLocale } from "@/i18n/LocaleProvider";

export default function Address() {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { t } = useLocale();

  const solanaBalance = useBalance({ connection, publicKey: publicKey! });
  const [tokenXBalance, setTokenXBalance] = useState<Balance>({
    amount: 0,
    lamports: 1,
    decimals: 1,
  });
  const [tokenYBalance, setTokenYBalance] = useState<Balance>({
    amount: 0,
    lamports: 1,
    decimals: 1,
  });

  const [poolData, setPoolData] = useState<Pool>();

  const [amountX, setAmountX] = useState("");
  const [amountY, setAmountY] = useState("");
  const [selectedMode, setSelectedMode] = useState<PositionMode>("default");

  const [tokenX, tokenY] = poolData?.name.split("-") || ["", ""];

  const { priorityLevel, solPrice, updateSolPrice } = useGlobalStore(
    (state) => state
  );

  const [upperPrice, setUpperPrice] = useState(0);
  const [lowerPrice, setLowerPrice] = useState(0);

  const [currentPositions, setCurrentPositions] = useState<LbPosition[]>([]);

  const [enabled, setEnabled] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [signature, setSignature] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const modes = [
    {
      name: t.liquidity.defaultMode,
      value: "default",
      description: t.liquidity.defaultModeDesc,
    },
    {
      name: t.liquidity.stableMode,
      value: "stable",
      description: t.liquidity.stableModeDesc,
    },
    {
      name: t.liquidity.volatileMode,
      value: "volatile",
      description: t.liquidity.volatileModeDesc,
    },
  ];

  const createBalancePositionClick = async () => {
    try {
      if (!publicKey) {
        throw new Error("Wallet is not Connected");
      }

      if (Number(amountX) === 0 && Number(amountY) === 0) {
        throw new Error(t.liquidity.invalidAmount);
      }

      if (
        Number(amountX) > tokenXBalance.amount ||
        Number(amountY) > tokenYBalance.amount
      ) {
        throw new Error(t.liquidity.insufficientBalance);
      }

      setIsLoading(true);

      const { transaction: balancePositionTx, additionalSigners } =
        await createImbalancePosition(
        connection,
        publicKey,
        address,
        {
          amountX: Number(amountX),
          tokenXLamports: tokenXBalance.lamports,
          amountY: Number(amountY),
          tokenYLamports: tokenYBalance.lamports,
          mode: selectedMode,
          priorityLevel: priorityLevel,
        }
      );

      const sigResult = await sendTrustTransaction(
        balancePositionTx,
        connection,
        sendTransaction,
        undefined,
        additionalSigners
      );
      if (sigResult) {
        setSignature(sigResult);
        setIsOpen(true);
      }

      setTimeout(() => {
        void getAccountState();
      }, 1000 * 10);
      setTimeout(() => {
        void getAccountState();
      }, 1000 * 30);

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("createBalancePositionClick failed:", err.message, err);
      } else {
        console.error("createBalancePositionClick failed with value:", err);
      }
      alert(t.liquidity.checkBalanceAndConfirm);
    }

    setIsLoading(false);
  };

  const closePositionClick = async (position: LbPosition) => {
    try {
      if (!publicKey) {
        throw new Error("Wallet is not Connected");
      }
      const closePositionTxs = await removePositionLiquidity(
        connection,
        publicKey,
        address,
        position,
        priorityLevel
      );

      for (const closePositionTx of closePositionTxs) {
        await sendTrustTransaction(
          closePositionTx,
          connection,
          sendTransaction,
          { skipPreflight: false, preflightCommitment: "singleGossip" }
        );
      }

      setTimeout(() => {
        void getAccountState();
      }, 1000 * 10);
      setTimeout(() => {
        void getAccountState();
      }, 1000 * 30);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("You refused to closePosition");
    }
  };

  const fetchTokenBalance = useCallback(
    async (mintAddress: string) => {
      if (!publicKey) {
        // console.log("Wallet not connected");
        return {
          amount: 0,
          lamports: 1,
          decimals: 1,
        };
      }

      const mint = new PublicKey(mintAddress);
      const tokenAccountAddress = await getAssociatedTokenAddress(
        mint,
        publicKey
      );
      const mintInfo = await getMint(connection, mint);
      const decimals = mintInfo.decimals;
      const lamportsPerToken = Math.pow(10, decimals);

      try {
        const tokenAccount = await getAccount(connection, tokenAccountAddress);

        return {
          amount: parseFloat(
            (Number(tokenAccount.amount) / lamportsPerToken).toFixed(decimals)
          ),
          lamports: lamportsPerToken,
          decimals: decimals,
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.log("Token account not found or error occurred:", error);
        return {
          amount: 0,
          lamports: lamportsPerToken,
          decimals: decimals,
        };
      }
    },
    [connection, publicKey]
  );

  const getBalances = useCallback(async () => {
    if (!publicKey || !poolData) {
      return;
    }

    if (poolData.mint_x !== SOL_CONTRACT) {
      const tokenAmountX = await fetchTokenBalance(poolData.mint_x);
      setTokenXBalance(tokenAmountX);
    }

    if (poolData.mint_y !== SOL_CONTRACT) {
      const tokenAmountY = await fetchTokenBalance(poolData.mint_y);
      setTokenYBalance(tokenAmountY);
    }
  }, [fetchTokenBalance, poolData, publicKey]);

  const getPositions = useCallback(async () => {
    if (!publicKey) {
      return;
    }

    const positionData = await getPositionsState(
      connection,
      publicKey,
      address
    );
    setCurrentPositions(positionData);
    // console.log("🚀 ~ positionData:", positionData);
  }, [address, connection, publicKey]);

  const getAccountState = useCallback(async () => {
    await Promise.all([getBalances(), getPositions()]);
  }, [getBalances, getPositions]);

  useEffect(() => {
    if (address) {
      (async function getPoolData() {
        const { data: poolData } = await fetchData(`/api/pool/${address}`);
        // console.log("🚀 ~ poolData:", poolData);
        setPoolData(poolData);
      })();
    }
  }, [address]);

  useEffect(() => {
    if (solPrice === 0) {
      (async function getSolPrice() {
        const { price: solPrice } = await fetchData("/api/price");
        updateSolPrice(solPrice);
      })();
    }
  }, [solPrice, updateSolPrice]);

  useEffect(() => {
    if (poolData) {
      const solDecimals = converLamportsToDecimal(LAMPORTS_PER_SOL);
      const currentBalance = {
        amount: parseFloat(
          (solanaBalance / LAMPORTS_PER_SOL).toFixed(solDecimals)
        ),
        lamports: LAMPORTS_PER_SOL,
        decimals: solDecimals,
      };
      if (tokenX === "SOL" && poolData.mint_x === SOL_CONTRACT) {
        setTokenXBalance(currentBalance);
        void getAccountState();
      }
      if (tokenY === "SOL" && poolData.mint_y === SOL_CONTRACT) {
        setTokenYBalance(currentBalance);
        void getAccountState();
      }
    }
  }, [getAccountState, poolData, solanaBalance, tokenX, tokenY]);

  useEffect(() => {
    if (!publicKey || !poolData) {
      return;
    }

    void getAccountState();
  }, [getAccountState, poolData, publicKey]);

  useEffect(() => {
    if (Number(amountX) > 0 || Number(amountY) > 0) {
      (async function getCurrentBinInfo() {
        const binInfo = await getBinInfo(connection, address, {
          amountX: Number(amountX),
          tokenXLamports: tokenXBalance.lamports,
          amountY: Number(amountY),
          tokenYLamports: tokenYBalance.lamports,
          mode: selectedMode,
        });
        // console.log("🚀 ~ binInfo:", binInfo);
        const { upperBin, lowerBin } = binInfo;
        if (tokenY === "SOL") {
          const currentUpperPrice = Number(upperBin.pricePerToken) * solPrice;
          const currentLowerPrice = Number(lowerBin.pricePerToken) * solPrice;
          setUpperPrice(currentUpperPrice);
          setLowerPrice(currentLowerPrice);
        } else if (tokenX === "SOL") {
          const currentUpperPrice = Number(upperBin.pricePerToken);
          const currentLowerPrice = Number(lowerBin.pricePerToken);
          setUpperPrice(currentUpperPrice);
          setLowerPrice(currentLowerPrice);
        }
      })();
    }
  }, [
    address,
    amountX,
    amountY,
    connection,
    selectedMode,
    solPrice,
    tokenX,
    tokenXBalance,
    tokenY,
    tokenYBalance,
  ]);

  useEffect(() => {
    if (poolData && enabled && Number(amountX) > 0) {
      setAmountY((parseFloat(amountX) * poolData.current_price).toFixed(6));
    }
  }, [amountX, enabled, poolData]);

  return (
    <div className="min-h-[calc(100wh-48px)] text-white">
      <NavBar />
      {poolData && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <PoolTopBar poolData={poolData} tokenX={tokenX} />
          <div className="w-full flex flex-col-reverse xl:flex-row justify-start items-start space-y-2 space-y-reverse xl:space-y-0 xl:space-x-2">
            {/* Chart Card */}
            <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg px-6 py-4 w-full basis-full xl:basis-1/2">
              <h2 className="text-xl font-semibold mb-4">
                {t.pool.currentPrice}{" "}
                {formatUSD(
                  poolData.name.endsWith("-SOL")
                    ? poolData.current_price * solPrice
                    : poolData.current_price
                )}
              </h2>
              <KlineChart
                poolAddress={address}
                upperPrice={upperPrice}
                lowerPrice={lowerPrice}
              />
            </div>
            <TabGroup
              defaultIndex={0}
              className="w-full basis-full xl:basis-1/2"
            >
              <TabList className="flex justify-between items-center gap-4 w-full mb-2">
                <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-gray-900/50 data-[hover]:bg-white/10 data-[selected]:data-[hover]:bg-gray-900/50 data-[focus]:outline-1 data-[focus]:outline-white basis-2/4 backdrop-blur-md">
                  {t.liquidity.addLiquidity}
                </Tab>
                <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-gray-900/50 data-[hover]:bg-white/10 data-[selected]:data-[hover]:bg-gray-900/50 data-[focus]:outline-1 data-[focus]:outline-white basis-1/4 backdrop-blur-md">
                  {t.liquidity.swap}
                </Tab>
                <PrioritySelect />
              </TabList>
              <TabPanels>
                <TabPanel>
                  {/* Add Liquidity Card */}
                  <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg px-6 py-4">
                    <h2 className="text-xl font-semibold mb-3 flex justify-between">
                      <span>{t.liquidity.addLiquidity}</span>
                      <span className="flex items-center space-x-2">
                        <span className="text-sm">
                          {enabled ? t.liquidity.autoCalc : t.liquidity.manualSet}
                        </span>
                        <Switch
                          checked={enabled}
                          onChange={setEnabled}
                          className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-[checked]:bg-blue-600"
                        >
                          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
                        </Switch>
                      </span>
                    </h2>

                    {/* Mode Selection */}
                    {!enabled && (
                      <div className="mb-3">
                        <RadioGroup
                          value={selectedMode}
                          onChange={setSelectedMode}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 select-none">
                            {modes.map((mode) => (
                              <Radio
                                key={mode.value}
                                value={mode.value}
                                className={({ checked }) =>
                                  `${
                                    checked
                                      ? "bg-blue-900/50 backdrop-blur-md"
                                      : "bg-gray-900/50 backdrop-blur-md"
                                  }
                        rounded-lg px-4 py-2 text-sm xl:py-4 xl:text-base cursor-pointer transition-colors`
                                }
                              >
                                {({ checked }) => (
                                  <div>
                                    <Label
                                      className={`font-medium ${
                                        checked
                                          ? "text-blue-300"
                                          : "text-gray-200"
                                      }`}
                                    >
                                      {mode.name}
                                    </Label>
                                    <Description
                                      className={`text-sm ${
                                        checked
                                          ? "text-blue-400"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {mode.description}
                                    </Description>
                                  </div>
                                )}
                              </Radio>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* Input Fields */}
                    <div className="flex flex-col w-full justify-center items-center space-y-4">
                      <div className="rounded-lg w-full basis-full">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-300">
                            {t.liquidity.amount.replace("{token}", tokenX)}
                          </label>
                          <div className="text-sm text-gray-400 flex justify-center items-center gap-1">
                            {tokenXBalance.amount} {tokenX}
                            <Wallet width={16} height={16} />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={amountX}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Replace leading zeros, but keep a single zero if there's no other number or decimal point
                              let sanitizedValue = value.replace(/^0+/, "");
                              if (sanitizedValue === "") {
                                sanitizedValue = "0"; // If the result is empty, set it back to '0'
                              } else if (
                                sanitizedValue !== "0" &&
                                value !== "0" &&
                                !value.includes(".")
                              ) {
                                // Ensure that if the first character was a zero and there's no decimal, it's removed
                                sanitizedValue = sanitizedValue.replace(
                                  /^0+/,
                                  ""
                                );
                              }

                              // Handle decimal inputs
                              if (value.includes(".")) {
                                const parts = value.split(".");
                                if (parts[0] === "0") {
                                  sanitizedValue =
                                    "0." + parts.slice(1).join(".");
                                } else {
                                  sanitizedValue =
                                    parts[0].replace(/^0+/, "") +
                                    "." +
                                    parts.slice(1).join(".");
                                }
                              }

                              const numberValue =
                                sanitizedValue !== ""
                                  ? Number(sanitizedValue)
                                  : 0;

                              if (tokenX === "SOL") {
                                if (numberValue > tokenXBalance.amount - 0.1) {
                                  setAmountX(
                                    String(tokenXBalance.amount - 0.1)
                                  );
                                } else {
                                  setAmountX(sanitizedValue);
                                }
                              } else {
                                if (numberValue > tokenXBalance.amount) {
                                  setAmountX(String(tokenXBalance.amount));
                                } else {
                                  setAmountX(sanitizedValue);
                                }
                              }
                            }}
                            className="flex-1 rounded-lg bg-gray-900/50 backdrop-blur-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                            placeholder="0.0"
                          />
                          <button
                            onClick={() =>
                              setAmountX(
                                String(
                                  tokenX === "SOL"
                                    ? (tokenXBalance.amount - 0.1).toFixed(
                                        tokenXBalance.decimals
                                      )
                                    : tokenXBalance.amount.toFixed(
                                        tokenXBalance.decimals
                                      )
                                )
                              )
                            }
                            className="px-4 py-2 border border-gray-500 hover:border-gray-300 rounded-lg text-xs xl:text-sm font-medium text-white"
                          >
                            {t.liquidity.max}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg w-full basis-full">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-300">
                            {t.liquidity.amount.replace("{token}", tokenY)}
                          </label>
                          <div className="text-sm text-gray-400 flex justify-center items-center gap-1">
                            {tokenYBalance.amount} {tokenY}
                            <Wallet width={16} height={16} />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <input
                            disabled={enabled}
                            type="number"
                            value={amountY}
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
                                sanitizedValue = sanitizedValue.replace(
                                  /^0+/,
                                  ""
                                );
                              }

                              if (value.includes(".")) {
                                const parts = value.split(".");
                                if (parts[0] === "0") {
                                  sanitizedValue =
                                    "0." + parts.slice(1).join(".");
                                } else {
                                  sanitizedValue =
                                    parts[0].replace(/^0+/, "") +
                                    "." +
                                    parts.slice(1).join(".");
                                }
                              }

                              const numberValue =
                                sanitizedValue !== ""
                                  ? Number(sanitizedValue)
                                  : 0;

                              if (tokenY === "SOL") {
                                if (numberValue > tokenYBalance.amount - 0.1) {
                                  setAmountY(
                                    String(tokenYBalance.amount - 0.1)
                                  );
                                } else {
                                  setAmountY(sanitizedValue);
                                }
                              } else {
                                if (numberValue > tokenYBalance.amount) {
                                  setAmountY(String(tokenYBalance.amount));
                                } else {
                                  setAmountY(sanitizedValue);
                                }
                              }
                            }}
                            className={`flex-1 rounded-lg bg-gray-900/50 backdrop-blur-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-white ${
                              enabled ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            placeholder="0.0"
                          />
                          <button
                            disabled={enabled} // Note: Changed to enabled for logical consistency
                            onClick={() =>
                              setAmountY(
                                tokenY === "SOL"
                                  ? (tokenYBalance.amount - 0.1).toFixed(
                                      tokenYBalance.decimals
                                    )
                                  : tokenYBalance.amount.toFixed(
                                      tokenYBalance.decimals
                                    )
                              )
                            }
                            className={`px-4 py-2 border border-gray-500 hover:border-gray-300 rounded-lg text-xs xl:text-sm font-medium text-white ${
                              enabled ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            {t.liquidity.max}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      disabled={isLoading}
                      className="w-full mt-3 bg-blue-900/70 hover:bg-blue-700/70 backdrop-blur-md text-white font-medium py-3 px-4 rounded-lg transition-colors"
                      onClick={() => {
                        createBalancePositionClick();
                      }}
                    >
                      {isLoading ? t.liquidity.processing : t.liquidity.confirmAddLiquidity}
                    </button>
                    {/*interaction notice */}
                    <p className="text-xs xl:text-sm text-lime-400 mt-2">
                      {t.liquidity.securityNotice}
                    </p>
                    <p className="text-xs xl:text-sm text-gray-400 mt-2">
                      {t.liquidity.rentNotice.split("{amount}")[0]}
                      <strong> 0.05 </strong>
                      {t.liquidity.rentNotice.split("{amount}")[1]}
                    </p>
                    <p className="text-xs xl:text-sm text-gray-400 mt-2">
                      {t.liquidity.feeNotice.split("{amount}")[0]}
                      <strong> 0.005 </strong>
                      {t.liquidity.feeNotice.split("{amount}")[1]}
                    </p>
                  </div>
                </TabPanel>
                <TabPanel>
                  <SwapCard
                    tokenX={tokenX}
                    tokenXBalance={tokenXBalance}
                    tokenY={tokenY}
                    tokenYBalance={tokenYBalance}
                    getBalances={getBalances}
                  />
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </div>
          {/* Current Positions Card */}
          <PositionCard
            currentPositions={currentPositions}
            tokenX={tokenX}
            tokenY={tokenY}
            tokenXBalance={tokenXBalance}
            tokenYBalance={tokenYBalance}
            closePositionClick={closePositionClick}
          />
        </div>
      )}
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        signature={signature}
      />
    </div>
  );
}

