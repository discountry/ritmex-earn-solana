"use client";

import { Balance } from "@/service/meteora";
import { formatNumber } from "@/utils/formatter";
import { LbPosition } from "@meteora-ag/dlmm";
import { useLocale } from "@/i18n/LocaleProvider";

interface PositionCardProps {
  currentPositions: LbPosition[];
  tokenX: string;
  tokenXBalance: Balance;
  tokenY: string;
  tokenYBalance: Balance;
  closePositionClick: (position: LbPosition) => void;
}

export default function PositionCard({
  currentPositions,
  tokenX,
  tokenXBalance,
  tokenY,
  tokenYBalance,
  closePositionClick,
}: PositionCardProps) {
  const { t } = useLocale();

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg p-6 mt-2">
      <h2 className="text-xl font-semibold mb-4">{t.position.currentPositions}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentPositions.map((position) => (
          <div
            key={position.publicKey.toString()}
            className="border border-gray-700 p-4 rounded-lg"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">{t.position.positionId}</span>
              <span className="text-sm text-gray-400">
                {position.publicKey.toString().slice(0, 8)}...
                {position.publicKey.toString().slice(-8)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">
                {t.position.positionFunds}
              </span>
              <span className="text-sm text-gray-400">
                {formatNumber(
                  parseFloat(position.positionData.totalXAmount) /
                    tokenXBalance.lamports
                )}{" "}
                {tokenX} +{" "}
                {formatNumber(
                  parseFloat(position.positionData.totalYAmount) /
                    tokenYBalance.lamports
                )}{" "}
                {tokenY}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">
                {t.position.earnedFees}
              </span>
              <span className="text-sm text-gray-400">
                {formatNumber(
                  position.positionData.feeX.toNumber() / tokenXBalance.lamports
                )}{" "}
                {tokenX} +{" "}
                {formatNumber(
                  position.positionData.feeY.toNumber() / tokenYBalance.lamports
                )}{" "}
                {tokenY}
              </span>
            </div>
            <button
              className="w-full bg-red-900 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
              onClick={() => {
                closePositionClick(position);
              }}
            >
              {t.position.closePosition}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
