'use client';

import { useAccount } from 'wagmi';
import { useInventory } from '@/hooks/useInventory';
import { NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import { NftGalleryCard } from '@/components/NftGalleryCard';

const OPENSEA_COLLECTION = `https://opensea.io/assets/base/${NFT_CONTRACT_ADDRESS}`;

export function InventoryPanel() {
  const { isConnected } = useAccount();
  const { data: items = [], isLoading, refetch, isFetching } = useInventory();

  if (!isConnected) {
    return (
      <div className="h-full flex items-center justify-center text-center text-zinc-400 text-sm p-6">
        Connect wallet to see your NFT inventory.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="shrink-0 px-3 pt-2 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-white font-bold text-sm tracking-wide">My Collection</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {items.length} NFT{items.length === 1 ? '' : 's'} on Base
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 hover:bg-purple-900/50 disabled:opacity-50"
          >
            {isFetching ? '…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto app-scroll px-3 py-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-zinc-500 text-xs">Loading NFTs…</p>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <span className="text-4xl mb-3 opacity-80">📦</span>
            <p className="text-zinc-300 text-sm font-medium">No NFTs yet</p>
            <p className="text-zinc-500 text-xs mt-1 max-w-[200px]">
              Open a crate on the Crate tab — your NFTs appear here instantly.
            </p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <NftGalleryCard key={item.tokenId} item={item} />
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="shrink-0 px-3 py-2.5 border-t border-zinc-800/80 bg-zinc-950/90">
          <a
            href={OPENSEA_COLLECTION}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 text-center rounded-xl border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-950/40 transition-colors"
          >
            View collection on OpenSea →
          </a>
        </div>
      )}
    </div>
  );
}
