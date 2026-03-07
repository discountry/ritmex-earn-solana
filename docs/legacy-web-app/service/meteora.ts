import {
  Keypair,
  Connection,
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  Transaction,
} from "@solana/web3.js";
import DLMM, { LbPosition } from "@meteora-ag/dlmm";
import BN from "bn.js";
import { StrategyType } from "@meteora-ag/dlmm";
import { FEE_WALLET, POSITION_FEE, SWAP_FEE } from "@/config/wallet";
import { getPriorityFeeEstimate } from "./transactions";
import { Priority } from "@/store/globalStore";

export type Balance = {
  amount: number;
  lamports: number;
  decimals: number;
};

export type PositionMode = "default" | "stable" | "volatile";

export type PositionOptions = {
  amountX: number;
  tokenXLamports: number;
  amountY: number;
  tokenYLamports: number;
  mode: PositionMode;
  priorityLevel?: Priority;
};

const PositionStrategyType = {
  default: StrategyType.Spot,
  stable: StrategyType.Curve,
  volatile: StrategyType.BidAsk,
};

export async function getActiveBin(dlmmPool: DLMM) {
  // Get pool state
  const activeBin = await dlmmPool.getActiveBin();
  // console.log("🚀 ~ activeBin:", activeBin);
  return activeBin;
}

// To create a balance deposit position
export type PreparedTransaction = {
  transaction: Transaction;
  additionalSigners: Keypair[];
};

export async function createBalancePositionTx(
  connection: Connection,
  publicKey: PublicKey,
  address: string
): Promise<PreparedTransaction> {
  const poolAddress = new PublicKey(address);
  const dlmmPool = await DLMM.create(connection, poolAddress);
  const activeBin = await getActiveBin(dlmmPool);
  const TOTAL_RANGE_INTERVAL = 34; // 10 bins on each side of the active bin
  const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
    Number(activeBin.price)
  );
  const totalXAmount = new BN(100);
  const totalYAmount = totalXAmount.mul(new BN(Number(activeBinPricePerToken)));

  // Create Position
  const newBalancePosition = new Keypair();
  const createPositionTx =
    await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newBalancePosition.publicKey,
      user: publicKey,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: StrategyType.Spot,
      },
    });

  return {
    transaction: createPositionTx,
    additionalSigners: [newBalancePosition],
  };
}

export async function createImbalancePosition(
  connection: Connection,
  publicKey: PublicKey,
  address: string,
  options: PositionOptions
): Promise<PreparedTransaction> {
  const poolAddress = new PublicKey(address);
  const dlmmPool = await DLMM.create(connection, poolAddress);
  const activeBin = await getActiveBin(dlmmPool);
  const TOTAL_RANGE_INTERVAL = 34; // 10 bins on each side of the active bin
  // const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  // const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
  let minBinId = activeBin.binId;
  let maxBinId = activeBin.binId;

  if (options.amountX === 0 && options.amountY > 0) {
    minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL * 2;
    maxBinId = activeBin.binId;
  } else if (options.amountX > 0 && options.amountY === 0) {
    minBinId = activeBin.binId;
    maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL * 2;
  } else {
    minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
  }

  const totalXAmount = new BN(options.amountX * options.tokenXLamports);
  const totalYAmount = new BN(options.amountY * options.tokenYLamports);

  // Create Position
  const newImbalancePosition = new Keypair();
  const createPositionTx =
    await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newImbalancePosition.publicKey,
      user: publicKey,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: PositionStrategyType[options.mode],
      },
    });

  // Create a transfer instruction for transferring SOL from wallet_1 to wallet_2
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: publicKey,
    toPubkey: FEE_WALLET,
    lamports: POSITION_FEE, // Convert transferAmount to lamports
  });

  // console.log("🚀 ~ transferInstruction:", transferInstruction);

  createPositionTx.add(transferInstruction);

  const recentPriorityFee = await getPriorityFeeEstimate(
    createPositionTx,
    options.priorityLevel
  );

  createPositionTx.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: recentPriorityFee,
    })
  );

  return {
    transaction: createPositionTx,
    additionalSigners: [newImbalancePosition],
  };
}

export async function createOneSidePosition(
  connection: Connection,
  publicKey: PublicKey,
  address: string
): Promise<PreparedTransaction> {
  const poolAddress = new PublicKey(address);
  const dlmmPool = await DLMM.create(connection, poolAddress);
  const activeBin = await getActiveBin(dlmmPool);
  const TOTAL_RANGE_INTERVAL = 34; // 10 bins on each side of the active bin
  const minBinId = activeBin.binId;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL * 2;

  const totalXAmount = new BN(0);
  const totalYAmount = new BN(50380255);

  // Create Position
  const newOneSidePosition = new Keypair();
  const createPositionTx =
    await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newOneSidePosition.publicKey,
      user: publicKey,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: StrategyType.Spot,
      },
    });

  // createPositionTx.instructions.map((instruction) => {
  //   console.log(instruction);
  // });

  // Create a transfer instruction for transferring SOL from wallet_1 to wallet_2
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: publicKey,
    toPubkey: FEE_WALLET,
    lamports: POSITION_FEE, // Convert transferAmount to lamports
  });

  // console.log("🚀 ~ transferInstruction:", transferInstruction);

  createPositionTx.add(transferInstruction);

  return {
    transaction: createPositionTx,
    additionalSigners: [newOneSidePosition],
  };
}

export async function getPositionsState(
  connection: Connection,
  publicKey: PublicKey,
  address: string
) {
  // Get position state
  const poolAddress = new PublicKey(address);
  const dlmmPool = await DLMM.create(connection, poolAddress);
  const positionsState = await dlmmPool.getPositionsByUserAndLbPair(publicKey);

  const userPositions = positionsState.userPositions;
  // console.log("🚀 ~ userPositions:", userPositions);

  return userPositions;
}

export async function getBinInfo(
  connection: Connection,
  address: string,
  options: PositionOptions
) {
  const poolAddress = new PublicKey(address);
  const dlmmPool = await DLMM.create(connection, poolAddress);
  const TOTAL_RANGE_INTERVAL = 33; // 10 bins on each side of the active bin

  let leftInterval = 0;
  let rightInterval = 0;

  if (options.amountX === 0 && options.amountY > 0) {
    leftInterval = TOTAL_RANGE_INTERVAL * 2;
    rightInterval = 0;
  } else if (options.amountX > 0 && options.amountY === 0) {
    leftInterval = 0;
    rightInterval = TOTAL_RANGE_INTERVAL * 2;
  } else {
    leftInterval = TOTAL_RANGE_INTERVAL;
    rightInterval = TOTAL_RANGE_INTERVAL;
  }

  const binInfo = await dlmmPool.getBinsAroundActiveBin(
    leftInterval,
    rightInterval
  );

  return {
    upperBin: binInfo.bins[binInfo.bins.length - 1],
    lowerBin: binInfo.bins[0],
  };
}

export async function removePositionLiquidity(
  connection: Connection,
  publicKey: PublicKey,
  address: string,
  positionData: LbPosition,
  priorityLevel: Priority
) {
  const poolAddress = new PublicKey(address);
  const dlmmPool = await DLMM.create(connection, poolAddress);
  const positionBinData = positionData.positionData.positionBinData;
  if (positionBinData.length === 0) {
    throw new Error("No liquidity bins available for removal");
  }

  const binIdsToRemove = positionBinData.map(({ binId }) => binId);
  const fromBinId = Math.min(...binIdsToRemove);
  const toBinId = Math.max(...binIdsToRemove);

  const removeLiquidityTxs = await dlmmPool.removeLiquidity({
    position: positionData.publicKey,
    user: publicKey,
    fromBinId,
    toBinId,
    bps: new BN(100 * 100),
    shouldClaimAndClose: true,
  });

  if (!Array.isArray(removeLiquidityTxs) || removeLiquidityTxs.length === 0) {
    throw new Error("Failed to generate remove liquidity transactions");
  }

  // Create a transfer instruction for transferring SOL from wallet_1 to wallet_2
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: publicKey,
    toPubkey: FEE_WALLET,
    lamports: SWAP_FEE, // Convert transferAmount to lamports
  });

  const lastTransaction =
    removeLiquidityTxs[removeLiquidityTxs.length - 1];
  lastTransaction.add(transferInstruction);

  for (const tx of removeLiquidityTxs) {
    const recentPriorityFee = await getPriorityFeeEstimate(
      tx,
      priorityLevel
    );
    tx.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: recentPriorityFee,
      })
    );
  }

  return removeLiquidityTxs;
}

export async function swapEmulate(
  connection: Connection,
  address: string,
  amount: number,
  swapYtoX: boolean
) {
  const poolAddress = new PublicKey(address);
  const dlmmPool = await DLMM.create(connection, poolAddress);

  const swapAmount = new BN(amount);
  // Swap quote
  const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

  const swapQuote = await dlmmPool.swapQuote(
    swapAmount,
    swapYtoX,
    new BN(1), // allowedSlippage * 100
    binArrays
  );

  return swapQuote;
}

export async function swap(
  connection: Connection,
  publicKey: PublicKey,
  address: string,
  amount: number,
  swapYtoX: boolean,
  priorityLevel: Priority
) {
  const poolAddress = new PublicKey(address);
  const dlmmPool = await DLMM.create(connection, poolAddress);

  const swapAmount = new BN(amount);
  // Swap quote
  const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

  const swapQuote = await dlmmPool.swapQuote(
    swapAmount,
    swapYtoX,
    new BN(50), // allowedSlippage = 0.5%
    binArrays
  );

  // console.log("🚀 ~ swapQuote:", swapQuote);

  // Swap
  const swapTx = await dlmmPool.swap({
    inToken: swapYtoX ? dlmmPool.tokenX.publicKey : dlmmPool.tokenY.publicKey,
    binArraysPubkey: swapQuote.binArraysPubkey,
    inAmount: swapAmount,
    lbPair: dlmmPool.pubkey,
    user: publicKey,
    minOutAmount: swapQuote.minOutAmount,
    outToken: swapYtoX ? dlmmPool.tokenY.publicKey : dlmmPool.tokenX.publicKey,
  });

  // Create a transfer instruction for transferring SOL from wallet_1 to wallet_2
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: publicKey,
    toPubkey: FEE_WALLET,
    lamports: SWAP_FEE, // Convert transferAmount to lamports
  });

  // console.log("🚀 ~ transferInstruction:", transferInstruction);

  swapTx.add(transferInstruction);

  const recentPriorityFee = await getPriorityFeeEstimate(swapTx, priorityLevel);

  swapTx.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: recentPriorityFee,
    })
  );

  return swapTx;
}
