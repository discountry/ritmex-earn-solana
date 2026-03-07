"use client";

import { Pool } from "@/utils/filter";
import Link from "next/link";
import Image from "next/image";
import { formatUSD } from "@/utils/formatter";
import { useLocale } from "@/i18n/LocaleProvider";

export default function PoolTopBar({
  poolData,
  tokenX,
}: {
  poolData: Pool;
  tokenX: string;
}) {
  const { t } = useLocale();

  return (
    <div className="bg-gray-900/50 backdrop-blur-md shadow-lg flex justify-between items-center px-6 py-3 rounded-lg my-2">
      <div className="flex justify-between items-center space-x-2">
        <span className="text-xl">{poolData.name}</span>
        <span className="hidden xl:block border border-sky-400 text-sky-500 px-3 py-0.5 rounded-full text-sm">
          {t.pool.fee} {poolData.base_fee_percentage}%
        </span>
        <span className="hidden xl:block border border-gray-400 px-3 py-0.5 rounded-full text-sm">
          {t.pool.binStep} {poolData.bin_step}
        </span>
      </div>

      <div className="flex justify-between items-center space-x-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-2">
          <div className="hidden xl:block">
            <div className="text-sm text-gray-300">{t.pool.tvl}</div>
            <div className="text-md">{formatUSD(poolData.liquidity)}</div>
          </div>
          <div className="hidden xl:block">
            <div className="text-sm text-gray-300">{t.pool.tradeVolume24h}</div>
            <div className="text-md">
              {formatUSD(poolData.trade_volume_24h)}
            </div>
          </div>
          <div className="hidden xl:block">
            <div className="text-sm text-gray-300">{t.pool.fees24h}</div>
            <div className="text-md">{formatUSD(poolData.fees_24h)}</div>
          </div>
          <div className="">
            <div className="text-sm text-gray-300">{t.pool.yield24h}</div>
            <div className="text-md font-bold text-lime-500">
              {((poolData.fees_24h / Number(poolData.liquidity)) * 100).toFixed(
                2
              )}
              %
            </div>
          </div>
        </div>
        <Link
          href={`https://gmgn.ai/sol/token/1nlmsTyJ_${poolData.mint_x}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-gray-600 px-2 py-2 rounded-full text-sm"
        >
          <Image
            src="/gmgn.png"
            alt="GMGN"
            title={t.pool.goToGmgn.replace("{tokenX}", tokenX)}
            width={16}
            height={16}
          />
        </Link>
        <Link
          href={`https://app.meteora.ag/dlmm/${poolData.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-gray-600 px-2 py-2 rounded-full text-sm"
        >
          <Image
            src="/meteora.svg"
            alt="Meteora"
            title={t.pool.goToMeteora.replace("{tokenX}", tokenX)}
            width={16}
            height={16}
          />
        </Link>
      </div>
    </div>
  );
}
