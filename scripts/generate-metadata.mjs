import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://my-mystic-crate.vercel.app';

const variants = [
  { id: 0, name: 'Mystic Shard', rarity: 'Common', imagePath: '/nfts/common/s1.png' },
  { id: 1, name: 'Mystic Ember', rarity: 'Common', imagePath: '/nfts/common/s2.png' },
  { id: 2, name: 'Mystic Dust', rarity: 'Common', imagePath: '/nfts/common/s3.png' },
  { id: 3, name: 'Mystic Pebble', rarity: 'Common', imagePath: '/nfts/common/s4.png' },
  { id: 4, name: 'Mystic Spark', rarity: 'Common', imagePath: '/nfts/common/s5.png' },
  { id: 5, name: 'Mystic Gleam', rarity: 'Common', imagePath: '/nfts/common/s6.png' },
  { id: 6, name: 'Mystic Pulse', rarity: 'Uncommon', imagePath: '/nfts/uncommon/s7.png' },
  { id: 7, name: 'Mystic Wave', rarity: 'Uncommon', imagePath: '/nfts/uncommon/s8.png' },
  { id: 8, name: 'Mystic Bloom', rarity: 'Uncommon', imagePath: '/nfts/uncommon/s9.png' },
  { id: 9, name: 'Mystic Crest', rarity: 'Uncommon', imagePath: '/nfts/uncommon/s10.png' },
  { id: 10, name: 'Mystic Arc', rarity: 'Uncommon', imagePath: '/nfts/uncommon/s11.png' },
  { id: 11, name: 'Mystic Prism', rarity: 'Rare', imagePath: '/nfts/rare/s12.png' },
  { id: 12, name: 'Mystic Nova', rarity: 'Rare', imagePath: '/nfts/rare/s13.png' },
  { id: 13, name: 'Mystic Eclipse', rarity: 'Rare', imagePath: '/nfts/rare/s14.png' },
  { id: 14, name: 'Mystic Aurora', rarity: 'Rare', imagePath: '/nfts/rare/s15.png' },
  { id: 15, name: 'Mystic Crown', rarity: 'Epic', imagePath: '/nfts/epic/s16.png' },
  { id: 16, name: 'Mystic Sovereign', rarity: 'Epic', imagePath: '/nfts/epic/s17.png' },
  { id: 17, name: 'Mystic Dominion', rarity: 'Epic', imagePath: '/nfts/epic/s18.png' },
  { id: 18, name: 'Mystic Oracle', rarity: 'Legendary', imagePath: '/nfts/legendary/s19.png' },
  { id: 19, name: 'Mystic Genesis', rarity: 'Legendary', imagePath: '/nfts/legendary/s20.png' },
];

const outDir = path.join(root, 'public', 'metadata', 'variants');
fs.mkdirSync(outDir, { recursive: true });

for (const v of variants) {
  const imageUrl = `${APP_URL}${v.imagePath}`;
  const json = {
    name: `${v.name} — Mystic Crate`,
    description:
      'A tradeable Mystic Crate NFT minted on Base. Open crates in the Mystic Crate Farcaster mini app.',
    image: imageUrl,
    image_url: imageUrl,
    external_url: APP_URL,
    attributes: [
      { trait_type: 'Rarity', value: v.rarity },
      { trait_type: 'Collection', value: 'Mystic Crate' },
      { trait_type: 'Chain', value: 'Base' },
      { trait_type: 'Variant', value: String(v.id) },
    ],
  };
  fs.writeFileSync(path.join(outDir, `${v.id}.json`), JSON.stringify(json, null, 2));
}

const collection = {
  name: 'Mystic Crate',
  description:
    'Mystery crate NFTs on Base. Each open mints a real ERC-721 you can hold, trade on OpenSea, and list on any Base marketplace.',
  image: `${APP_URL}/opengraph-image`,
  external_link: APP_URL,
  seller_fee_basis_points: 500,
  fee_recipient: '0xB2a3086539494F975C78D8D32c68a29e622eC6a5',
};

fs.mkdirSync(path.join(root, 'public', 'metadata'), { recursive: true });
fs.writeFileSync(path.join(root, 'public', 'metadata', 'collection.json'), JSON.stringify(collection, null, 2));

console.log(`Wrote ${variants.length} variant metadata files and collection.json`);
