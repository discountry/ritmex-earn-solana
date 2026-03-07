export interface PairGroup {
  name: string;
  pairs: Pair[];
}

export type PairGroupInfo = {
  name: string;
  lexical_order_mints: string;
  total_trade_volume: number;
  total_tvl: number;
  min_fee_tvl_ratio: number;
  max_fee_tvl_ratio: number;
  min_lm_apr: number;
  max_lm_apr: number;
};

export interface Pair {
  name: string;
  address: string;
  bin_step: number;
  base_fee_percentage: string;
  current_price: number;
  fees_24h: number;
  liquidity: string;
  mint_x: string;
  mint_y: string;
  trade_volume_24h: number;
  apr: number;
  apy: number;
}

export interface Pool {
  address: string;
  name: string;
  mint_x: string;
  mint_y: string;
  reserve_x: string;
  reserve_y: string;
  reserve_x_amount: number;
  reserve_y_amount: number;
  bin_step: number;
  base_fee_percentage: string;
  max_fee_percentage: string;
  protocol_fee_percentage: string;
  liquidity: string;
  reward_mint_x: string;
  reward_mint_y: string;
  fees_24h: number;
  today_fees: number;
  trade_volume_24h: number;
  cumulative_trade_volume: string;
  cumulative_fee_volume: string;
  current_price: number;
  apr: number;
  apy: number;
  farm_apr: number;
  farm_apy: number;
  hide: boolean;
}

export function pairFilter(pairs: Pair[], tvl_threshold: number): Pair[] {
  return pairs
    .filter((pair) => {
      return parseFloat(pair.liquidity) >= (tvl_threshold || 1);
    })
    .filter((pair) => {
      return pair.fees_24h / parseFloat(pair.liquidity) >= 0.001;
    })
    .sort((a, b) => {
      return (
        b.fees_24h / parseFloat(b.liquidity) -
        a.fees_24h / parseFloat(a.liquidity)
      );
    });
}

export function groupFilter(
  groups: PairGroup[],
  tvl_threshold: number
): PairGroup[] {
  return groups.map((group) => {
    return {
      name: group.name,
      pairs: pairFilter(group.pairs, tvl_threshold),
    };
  });
}

export function resultFilter(
  results: PairGroup[],
  tvl_threshold: number
): PairGroup[] {
  const filteredResults = groupFilter(results, tvl_threshold).filter(
    (group) => {
      return group.pairs.length > 0;
    }
  );

  return filteredResults;
}
