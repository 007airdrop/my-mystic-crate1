import type { RarityName } from './nft-variants';

export type RarityStyle = {
  badge: string;
  border: string;
  glow: string;
  label: string;
};

const STYLES: Record<RarityName, RarityStyle> = {
  Common: {
    label: 'Common',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/35',
    glow: 'from-emerald-500/25 to-transparent',
  },
  Uncommon: {
    label: 'Uncommon',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    border: 'border-blue-500/35',
    glow: 'from-blue-500/25 to-transparent',
  },
  Rare: {
    label: 'Rare',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    border: 'border-violet-500/35',
    glow: 'from-violet-500/25 to-transparent',
  },
  Epic: {
    label: 'Epic',
    badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    border: 'border-pink-500/35',
    glow: 'from-pink-500/25 to-transparent',
  },
  Legendary: {
    label: 'Legendary',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/35',
    glow: 'from-amber-500/25 to-transparent',
  },
};

export function getRarityStyle(rarity: string): RarityStyle {
  const key = (Object.keys(STYLES) as RarityName[]).find(
    (r) => r.toLowerCase() === rarity.toLowerCase(),
  );
  return key ? STYLES[key] : STYLES.Common;
}
