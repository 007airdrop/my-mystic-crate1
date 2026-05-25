/** Treasury wallet — receives crate open fees on Base. */
export const TREASURY_ADDRESS = '0xB2a3086539494F975C78D8D32c68a29e622eC6a5' as const;

import { DEPLOYED_NFT_CONTRACT } from './deployed-address';

const _contract =
  process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || DEPLOYED_NFT_CONTRACT || '';

/** On-chain Mystic Crate contract on Base. */
export const NFT_CONTRACT_ADDRESS = _contract as `0x${string}` | '';

export const OPEN_CRATE_PRICE = '0.000001' as const;
export const DAILY_ACTION_PRICE = '0.000001' as const;
export const MAX_MINTS_PER_DAY = 2;

export const mysticCrateAbi = [
  {
    type: 'event',
    name: 'CrateOpened',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'variantId', type: 'uint256', indexed: false },
      { name: 'xpAwarded', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DailyCheckIn',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'streakDay', type: 'uint256', indexed: false },
      { name: 'xpAwarded', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DailySpin',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'xpAwarded', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'openCrate',
    inputs: [],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'dailyCheckIn',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'dailySpin',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPlayerStats',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalXp', type: 'uint256' },
      { name: 'mintsRemaining', type: 'uint256' },
      { name: 'streak', type: 'uint256' },
      { name: 'canCheckIn', type: 'bool' },
      { name: 'canSpin', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLeaderboard',
    inputs: [],
    outputs: [
      { name: 'users', type: 'address[10]' },
      { name: 'scores', type: 'uint256[10]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'function',
    name: 'OPEN_PRICE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
