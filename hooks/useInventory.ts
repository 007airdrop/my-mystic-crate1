'use client';

import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { decodeEventLog, parseAbiItem } from 'viem';
import { mysticCrateAbi, NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import { getVariantById } from '@/lib/nft-variants';
import { publicClient, getRecentFromBlock } from '@/lib/chain-client';

export type InventoryItem = {
  tokenId: string;
  variantId: number;
  imagePath: string;
  rarity: string;
  name: string;
};

const ZERO = '0x0000000000000000000000000000000000000000' as const;

const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
);

const crateOpenedEvent = parseAbiItem(
  'event CrateOpened(address indexed player, uint256 indexed tokenId, uint256 variantId, uint256 xpAwarded)',
);

const tokenUriAbi = [
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;

async function metaFromTokenUri(tokenId: string): Promise<{
  imagePath: string;
  rarity: string;
  name: string;
  variantId: number;
} | null> {
  try {
    const uri = await publicClient.readContract({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: tokenUriAbi,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });
    const res = await fetch(uri as string, { cache: 'no-store' });
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      name?: string;
      attributes?: { trait_type: string; value: string }[];
    };
    const variantId = Number(
      meta.attributes?.find((a) => a.trait_type === 'Variant')?.value ?? 0,
    );
    const variant = getVariantById(variantId);
    if (!variant) return null;
    return {
      imagePath: variant.imagePath,
      rarity: variant.rarity,
      name: variant.name,
      variantId,
    };
  } catch {
    return null;
  }
}

export function useInventory() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['inventory', address, NFT_CONTRACT_ADDRESS],
    enabled: !!address && NFT_CONTRACT_ADDRESS.startsWith('0x'),
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!address) return [];

      const fromBlock = await getRecentFromBlock();
      const contract = NFT_CONTRACT_ADDRESS as `0x${string}`;

      const [transferLogs, crateLogs] = await Promise.all([
        publicClient.getLogs({
          address: contract,
          event: transferEvent,
          args: { to: address, from: ZERO },
          fromBlock,
          toBlock: 'latest',
        }),
        publicClient.getLogs({
          address: contract,
          event: crateOpenedEvent,
          args: { player: address },
          fromBlock,
          toBlock: 'latest',
        }).catch(() => []),
      ]);

      const variantByToken = new Map<string, number>();
      for (const log of crateLogs) {
        try {
          const d = decodeEventLog({ abi: mysticCrateAbi, data: log.data, topics: log.topics });
          if (d.eventName === 'CrateOpened') {
            variantByToken.set(d.args.tokenId?.toString() ?? '', Number(d.args.variantId));
          }
        } catch {
          continue;
        }
      }

      const tokenIds = new Set<string>();
      for (const log of transferLogs) {
        try {
          const d = decodeEventLog({ abi: [transferEvent], data: log.data, topics: log.topics });
          if (d.eventName === 'Transfer') {
            tokenIds.add(d.args.tokenId?.toString() ?? '');
          }
        } catch {
          continue;
        }
      }

      const items: InventoryItem[] = [];

      for (const tid of tokenIds) {
        if (!tid) continue;
        let variantId = variantByToken.get(tid);
        if (variantId == null) {
          const fromUri = await metaFromTokenUri(tid);
          if (fromUri) {
            items.push({ tokenId: tid, ...fromUri });
            continue;
          }
          variantId = 0;
        }
        const variant = getVariantById(variantId);
        items.push({
          tokenId: tid,
          variantId,
          imagePath: variant?.imagePath ?? '/nfts/common/s1.png',
          rarity: variant?.rarity ?? 'Common',
          name: variant?.name ?? `Mystic #${tid}`,
        });
      }

      return items.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
