import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const hideLowTVL = searchParams.get("hide_low_tvl") || `1000000`;
  const res = await fetch(
    `https://dlmm-api.meteora.ag/pair/all_by_groups?${new URLSearchParams({
      hideLowTVL,
    })}`
  );
  const data = await res.json();

  return Response.json({ data });
}
