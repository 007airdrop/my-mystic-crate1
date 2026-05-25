'use client';

import Image from 'next/image';
import { useAccount } from 'wagmi';
import { useInventory } from '@/hooks/useInventory';
import { NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import { openSeaAssetUrl } from '@/lib/nft-variants';

const OPENSEA_COLLECTION = `https://opensea.io/assets/base/${NFT_CONTRACT_ADDRESS}`;

export function InventoryPanel() {
  const { isConnected } = useAccount();
  const { data: items = [], isLoading, refetch } = useInventory();

  if (!isConnected) {
    return (
      <div className="text-center text-zinc-400 text-sm p-6">
        Connect wallet to see your NFT inventory.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-2 min-h-0">
      <div className="shrink-0 flex items-center justify-between mb-2 px-1">
        <p className="text-white font-bold text-sm">🎒 My NFT Inventory</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-[10px] text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
      </div>

      <p className="text-[10px] text-zinc-400 px-1 mb-2 shrink-0">
        Trade on OpenSea — your wallet already holds these on Base.
      </p>

      {isLoading && <p className="text-center text-zinc-500 text-sm py-8">Loading NFTs...</p>}

      {!isLoading && items.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-4xl mb-2">📦</p>
          <p className="text-zinc-400 text-sm">No NFTs yet.</p>
          <p className="text-zinc-500 text-xs mt-1">Press S on Crate tab to mint!</p>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 gap-2 pb-2">
        {items.map((item) => (
          <div
            key={item.tokenId}
            className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-2 flex flex-col"
          >
            <div className="relative aspect-square w-full mb-1">
              <Image
                src={item.imagePath}
                alt={item.name}
                fill
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
            <p className="text-[10px] font-bold text-purple-300 truncate">{item.rarity}</p>
            <p className="text-[9px] text-zinc-500">#{item.tokenId}</p>
            <a
              href={openSeaAssetUrl(NFT_CONTRACT_ADDRESS, item.tokenId)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 text-center py-1.5 rounded-lg bg-purple-600 text-white text-[9px] font-bold hover:bg-purple-500"
            >
              Sell on OpenSea
            </a>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <a
          href={OPENSEA_COLLECTION}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 mt-1 py-2 text-center rounded-full border border-purple-500 text-purple-300 text-xs font-semibold hover:bg-purple-950/50"
        >
          View full collection on OpenSea →
        </a>
      )}
    </div>
  );
}
