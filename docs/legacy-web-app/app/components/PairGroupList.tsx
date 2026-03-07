"use client";

import { fetchData } from "@/utils/helper";
import { useState, useEffect, useMemo } from "react";
import { ChevronDownIcon, Info } from "lucide-react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
} from "@headlessui/react";
import { formatUSD, formatNumber } from "@/utils/formatter";
import { PairGroup, PairGroupInfo, resultFilter } from "@/utils/filter";
import { findSOLPrice } from "@/utils/calculator";
import { useGlobalStore } from "./providers/StoreProvider";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/i18n/LocaleProvider";

function SkeletonItem() {
  return (
    <div className="rounded-lg shadow bg-gray-900/50 backdrop-blur-lg animate-pulse">
      <div className="px-4 py-3 flex justify-between items-center rounded-t-lg">
        <div className="h-6 bg-gray-700 rounded w-56"></div>
        <div className="h-6 bg-gray-700 rounded w-96 hidden xl:block"></div>
        <div className="h-6 bg-gray-700 rounded w-96"></div>
        <div className="h-5 w-5 bg-gray-700 rounded"></div>
      </div>
      <div className="p-4 border-t border-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-5 bg-gray-600 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PairGroupList() {
  const [pairGroups, setPairGroups] = useState<PairGroup[]>([]);
  const [pairGroupsMeta, setPairGroupsMeta] = useState<PairGroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { solPrice, updateSolPrice } = useGlobalStore((state) => state);
  const { t } = useLocale();

  const metaByName = useMemo(() => {
    const map = new Map<string, PairGroupInfo>();
    pairGroupsMeta.forEach((meta) => map.set(meta.name, meta));
    return map;
  }, [pairGroupsMeta]);

  const displayGroups = useMemo(() => {
    return pairGroups.map((group) => ({
      name: group.name,
      pairsSorted: [...group.pairs].sort(
        (a, b) => (b.fees_24h || 0) - (a.fees_24h || 0)
      ),
      meta: metaByName.get(group.name),
    }));
  }, [pairGroups, metaByName]);

  useEffect(() => {
    setIsLoading(true);

    Promise.all([
      fetchData("/api/group"),
      fetchData("/api/meta")
    ]).then(([groupResponse, metaResponse]) => {
      const { data: groupData } = groupResponse;
      const { data: metaData } = metaResponse;

      if (groupData.total > 0) {
        const filteredGroups = resultFilter(groupData.groups, 100000);
        setPairGroups(filteredGroups);
        const currentSolPrice = findSOLPrice(filteredGroups);
        updateSolPrice(currentSolPrice);
      }

      setPairGroupsMeta(metaData);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const getColorForGroup = (index: number) => {
    if (index === 0)
      return "bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-lg";
    if (index === 1)
      return "bg-gradient-to-r from-blue-600/30 to-cyan-600/30 backdrop-blur-lg";
    if (index === 2)
      return "bg-gradient-to-r from-green-600/30 to-lime-600/30 backdrop-blur-lg";
    return "bg-gray-900/50 backdrop-blur-lg";
  };

  return (
    <div className="w-screen mx-auto space-y-4 xl:p-4">
      <div className="flex flex-col items-start justify-start xl:max-w-7xl mx-auto px-4 py-1">
        <h1 className="text-lg font-bold mb-4 text-white flex item-center space-x-2">
          <Image src="/meteora.svg" alt="logo" width={24} height={24} />
          <span>{t.home.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 my-2 flex justify-start items-center space-x-1">
          <Info width={16} height={16} />
          <span>{t.home.filterNotice}</span>
        </p>
        <div className="space-y-2 w-full">
          {isLoading ? (
            [...Array(3)].map((_, index) => (
              <SkeletonItem key={index} />
            ))
          ) : (
            displayGroups.map((group, index) => (
              <Disclosure key={group.name}>
              {({ open }) => (
                <div className={`rounded-lg shadow ${getColorForGroup(index)}`}>
                  <DisclosureButton className="w-full px-4 py-3 flex justify-between items-center rounded-t-lg hover:bg-opacity-70">
                    <span className="font-medium w-56 text-sm xl:text-base text-left text-white">
                      {group.name}
                    </span>
                    <span className="text-gray-300 w-96 text-left hidden xl:block">
                      {t.home.totalTvl}
                      {formatUSD(group.meta?.total_tvl || 0)}
                    </span>
                    <span className="text-gray-300 w-96 text-left text-xs xl:text-base">
                      {t.home.tradeVolume24h}
                      {formatUSD(group.meta?.total_trade_volume || 0)}
                    </span>
                    <ChevronDownIcon
                      className={`w-5 h-5 transform transition-transform text-white ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </DisclosureButton>

                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <DisclosurePanel className="backdrop-blur-md rounded-b-lg">
                      {group.pairsSorted.map((pair) => (
                        <Link key={pair.address} href={`/dlmm/${pair.address}`}>
                          <div className="p-4 border-t border-gray-800">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-white">
                              <div>
                                <div className="text-xs xl:text-sm text-gray-400">
                                  {t.home.price}
                                </div>
                                <div className="font-medium">
                                  {formatUSD(
                                    pair.name.endsWith("-SOL")
                                      ? pair.current_price * solPrice
                                      : pair.current_price
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs xl:text-sm text-gray-400">
                                  {t.home.tvl}
                                </div>
                                <div className="font-medium">
                                  {formatUSD(pair.liquidity)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs xl:text-sm text-gray-400">
                                  {t.home.fees24h}
                                </div>
                                <div className="font-medium">
                                  {formatUSD(pair.fees_24h)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs xl:text-sm text-gray-400">
                                  {t.home.feesTvlRatio}
                                </div>
                                <div className="font-medium">
                                  {formatNumber(
                                    (pair.fees_24h /
                                      parseFloat(pair.liquidity)) *
                                      100
                                  )}
                                  %
                                </div>
                              </div>
                              <div>
                                <div className="text-xs xl:text-sm text-gray-400">
                                  {t.home.binStep}
                                </div>
                                <div className="font-medium">
                                  {pair.bin_step}
                                </div>
                              </div>
                              <div className="text-xs xl:text-sm break-all">
                                <div className="text-gray-400">{t.home.onChainAddress}</div>
                                <div className="font-mono">
                                  {pair.address.slice(0, 8)}...
                                  {pair.address.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </DisclosurePanel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          ))
          )}
        </div>
      </div>
    </div>
  );
}
