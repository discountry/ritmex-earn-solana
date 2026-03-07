import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const FEE_WALLET = new PublicKey(
  `H8jT9Mg6wrx4RiAT4cvFeYd6Qdqv3ivHvSQVk4NZrgB3`
);

export const POSITION_FEE = 0.005 * LAMPORTS_PER_SOL;

export const SWAP_FEE = 0.001 * LAMPORTS_PER_SOL;
