import { solanaWeb3, Solana } from "@quicknode/sdk";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const { PublicKey } = solanaWeb3;

    const programToSearch = new PublicKey(
      "CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY"
    );
    const numBlocks = 100;

    const endpoint = new Solana({
      endpointUrl:
        "https://young-clean-mansion.solana-mainnet.quiknode.pro/b283a489808595067e49f080967588882daeb500/",
    });

    const recentPriorityFees = await endpoint.fetchEstimatePriorityFees({
      last_n_blocks: numBlocks,
      account: programToSearch.toBase58(),
    });

    return Response.json({ recentPriorityFees });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
