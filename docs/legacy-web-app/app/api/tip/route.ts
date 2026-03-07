import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const res = await fetch(`https://bundles.jito.wtf/api/v1/bundles/tip_floor`);
  const data = await res.json();

  if (data.length > 0) {
    return Response.json({
      tips: Math.floor(data[0].landed_tips_50th_percentile * LAMPORTS_PER_SOL),
      time: data[0].time,
    });
  } else {
    return Response.json({ tips: 0 });
  }
}
