import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

/** Scan recent Base blocks for contract logs (public RPC rejects block 0). */
export async function getRecentFromBlock(): Promise<bigint> {
  const latest = await publicClient.getBlockNumber();
  const window = BigInt(5_000_000);
  return latest > window ? latest - window : BigInt(0);
}
