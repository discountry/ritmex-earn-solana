import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol") || `sol-usdc`;
  const res = await fetch(
    `https://dlmm-api.meteora.ag/pair/all_by_groups?limit=1&search_term=${symbol}&include_unknown=false&hide_low_tvl=10000000`
  );
  const data = await res.json();

  if (data.groups.length > 0) {
    return Response.json({ price: data.groups[0].pairs[0].current_price });
  } else {
    return Response.json({ price: 0 });
  }
}
