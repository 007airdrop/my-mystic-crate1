import { decodeEventLog, parseAbiItem, type TransactionReceipt } from 'viem';
import { mysticCrateAbi, NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import { getVariantById } from '@/lib/nft-variants';

const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
);

export type MintResult = {
  tokenId: string;
  variantId: number;
  xpAwarded: number;
  imagePath: string;
  rarity: string;
  name: string;
};

export function parseMintFromReceipt(receipt: TransactionReceipt): MintResult | null {
  const contract = NFT_CONTRACT_ADDRESS.toLowerCase();
  let tokenId: string | null = null;
  let variantId: number | null = null;
  let xpAwarded = 0;

  for (const log of receipt.logs) {
    if (log.address?.toLowerCase() !== contract) continue;
    try {
      const decoded = decodeEventLog({
        abi: mysticCrateAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'CrateOpened') {
        tokenId = decoded.args.tokenId?.toString() ?? null;
        variantId = Number(decoded.args.variantId);
        xpAwarded = Number(decoded.args.xpAwarded ?? 0);
      }
    } catch {
      /* try next log */
    }
  }

  if (!tokenId) {
    for (const log of receipt.logs) {
      if (log.address?.toLowerCase() !== contract) continue;
      try {
        const decoded = decodeEventLog({
          abi: [transferEvent],
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'Transfer' && decoded.args.from === '0x0000000000000000000000000000000000000000') {
          tokenId = decoded.args.tokenId?.toString() ?? null;
        }
      } catch {
        continue;
      }
    }
  }

  if (!tokenId) return null;

  if (variantId == null || Number.isNaN(variantId)) {
    variantId = 0;
  }

  const variant = getVariantById(variantId);
  if (!variant) return null;

  return {
    tokenId,
    variantId,
    xpAwarded,
    imagePath: variant.imagePath,
    rarity: variant.rarity.toUpperCase(),
    name: variant.name,
  };
}
