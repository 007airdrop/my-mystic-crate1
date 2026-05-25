'use client';

import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, decodeEventLog, parseAbiItem } from 'viem';
import { base } from 'wagmi/chains';
import { mysticCrateAbi, NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import { getVariantById } from '@/lib/nft-variants';

export type InventoryItem = {
  tokenId: string;
  variantId: number;
  imagePath: string;
  rarity: string;
  name: string;
};

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const crateOpenedEvent = parseAbiItem(
  'event CrateOpened(address indexed player, uint256 indexed tokenId, uint256 variantId, uint256 xpAwarded)',
);

export function useInventory() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['inventory', address, NFT_CONTRACT_ADDRESS],
    enabled: !!address && NFT_CONTRACT_ADDRESS.startsWith('0x'),
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!address) return [];

      const logs = await publicClient.getLogs({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        event: crateOpenedEvent,
        args: { player: address },
        fromBlock: BigInt(0),
        toBlock: 'latest',
      });

      const items: InventoryItem[] = [];

      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: mysticCrateAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName !== 'CrateOpened') continue;

          const tokenId = decoded.args.tokenId?.toString() ?? '0';
          const variantId = Number(decoded.args.variantId ?? 0);
          const variant = getVariantById(variantId);
          items.push({
            tokenId,
            variantId,
            imagePath: variant?.imagePath ?? '/nfts/common/s1.png',
            rarity: variant?.rarity ?? 'Common',
            name: variant?.name ?? `Mystic #${tokenId}`,
          });
        } catch {
          continue;
        }
      }

      return items.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
    },
    staleTime: 30_000,
  });
}
