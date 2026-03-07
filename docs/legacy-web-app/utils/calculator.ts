import { PairGroup } from "./filter";

export function findSOLPrice(groups: PairGroup[]) {
  const solGroup = groups.find((group) => group.name === "SOL-USDC");
  const current_sol_price = solGroup?.pairs.sort((a, b) => {
    return b.trade_volume_24h - a.trade_volume_24h;
  })[0].current_price;
  return current_sol_price || 1;
}
