'use client';

import Image from 'next/image';
import { NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import { APP_URL } from '@/lib/constants';
import { openSeaAssetUrl } from '@/lib/nft-variants';
import { getRarityStyle } from '@/lib/rarity-styles';
import type { InventoryItem } from '@/hooks/useInventory';

function nftImageSrc(path: string): string {
  if (path.startsWith('http')) return path;
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

type NftGalleryCardProps = {
  item: InventoryItem;
};

export function NftGalleryCard({ item }: NftGalleryCardProps) {
  const style = getRarityStyle(item.rarity);

  return (
    <article
      className={`group rounded-2xl border bg-zinc-900/90 overflow-hidden flex flex-col ${style.border}`}
    >
      <div className={`relative aspect-square bg-gradient-to-b ${style.glow} to-zinc-950 p-2`}>
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-950/80 ring-1 ring-white/5">
          <Image
            src={nftImageSrc(item.imagePath)}
            alt={item.name}
            fill
            className="object-contain p-1"
            unoptimized
            sizes="(max-width: 420px) 50vw"
          />
        </div>
        <span
          className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${style.badge}`}
        >
          {item.rarity}
        </span>
      </div>
      <div className="px-2.5 pb-2.5 pt-1 flex flex-col gap-1 min-w-0">
        <p className="text-[11px] font-semibold text-white truncate">{item.name}</p>
        <p className="text-[10px] text-zinc-500">#{item.tokenId}</p>
        <a
          href={openSeaAssetUrl(NFT_CONTRACT_ADDRESS, item.tokenId)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 w-full text-center py-2 rounded-lg bg-purple-600/90 text-white text-[10px] font-bold hover:bg-purple-500 transition-colors"
        >
          OpenSea
        </a>
      </div>
    </article>
  );
}
