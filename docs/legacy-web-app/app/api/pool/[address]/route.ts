export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
): Promise<Response> {
  const pair =
    (await params).address || `5BKxfWMbmYBAEWvyPZS9esPducUba9GqyMjtLCfbaqyF`;
  const res = await fetch(`https://dlmm-api.meteora.ag/pair/${pair}`);
  const data = await res.json();

  return Response.json({ data });
}
