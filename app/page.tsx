'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from 'wagmi';
import { base } from 'wagmi/chains';
import { parseEther } from 'viem';
import Image from 'next/image';
import { ConnectWallet } from '@/components/ConnectWallet';
import { QuickNav, type AppScreen } from '@/components/QuickNav';
import { CheckInPanel } from '@/components/CheckInPanel';
import { SpinWheelPanel } from '@/components/SpinWheelPanel';
import { InventoryPanel } from '@/components/InventoryPanel';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import {
  mysticCrateAbi,
  OPEN_CRATE_PRICE,
  NFT_CONTRACT_ADDRESS,
  MAX_MINTS_PER_DAY,
} from '@/lib/contracts';
import { APP_URL } from '@/lib/constants';
import { openSeaAssetUrl } from '@/lib/nft-variants';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { parseMintFromReceipt } from '@/lib/parse-mint';

const rarities = [
  { name: 'COMMON', prob: 50, color: '#22C55E' },
  { name: 'UNCOMMON', prob: 30, color: '#3B82F6' },
  { name: 'RARE', prob: 15, color: '#8B5CF6' },
  { name: 'EPIC', prob: 7, color: '#EC4899' },
  { name: 'LEGENDARY', prob: 3, color: '#F59E0B' },
] as const;

const hasNftContract =
  NFT_CONTRACT_ADDRESS.length > 0 && NFT_CONTRACT_ADDRESS.startsWith('0x');

export default function Home() {
  const queryClient = useQueryClient();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending: isSending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } =
    useWaitForTransactionReceipt({ hash });
  const { totalXp, mintsRemaining, refetch: refetchStats } = usePlayerStats();

  const [screen, setScreen] = useState<AppScreen>('crate');
  const [isOpening, setIsOpening] = useState(false);
  const [revealedNFT, setRevealedNFT] = useState<string | null>(null);
  const [rarity, setRarity] = useState('');
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [lastXpGain, setLastXpGain] = useState<number | null>(null);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicStarted, setMusicStarted] = useState(false);
  const [xpToast, setXpToast] = useState<string | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const showXpToast = useCallback((msg: string) => {
    setXpToast(msg);
    setTimeout(() => setXpToast(null), 3500);
    void refetchStats();
  }, [refetchStats]);

  const startMusic = useCallback(() => {
    if (!musicEnabled || musicStarted) return;
    const audio = new Audio('/sounds/background-music.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch((err) => console.warn('Music error:', err));
    bgMusicRef.current = audio;
    setMusicStarted(true);
  }, [musicEnabled, musicStarted]);

  const toggleMusic = () => {
    if (bgMusicRef.current) {
      if (musicEnabled) {
        bgMusicRef.current.pause();
        setMusicEnabled(false);
      } else {
        bgMusicRef.current.play().catch((err) => console.warn('Music error:', err));
        setMusicEnabled(true);
      }
    } else {
      setMusicEnabled((prev) => !prev);
    }
  };

  const revealFromReceipt = useCallback(() => {
    if (!receipt) return false;
    const mint = parseMintFromReceipt(receipt);
    if (!mint) return false;

    setRarity(mint.rarity);
    setRevealedNFT(mint.imagePath);
    setTokenId(mint.tokenId);
    setLastXpGain(mint.xpAwarded);
    setIsOpening(false);
    void refetchStats();
    void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    new Audio('/sounds/reveal.mp3').play().catch((err) => console.warn('Sound error:', err));
    return true;
  }, [receipt, refetchStats, queryClient]);

  const performOpenAnimation = useCallback(() => {
    setIsOpening(true);
    new Audio('/sounds/crate-open.mp3').play().catch((err) => console.warn('Sound error:', err));
  }, []);

  useEffect(() => {
    if (!isConfirmed || !waitingForPayment) return;
    setWaitingForPayment(false);

    const timer = setTimeout(() => {
      if (!revealFromReceipt()) {
        setIsOpening(false);
        alert('Mint confirmed! Open Items tab — if image missing, refresh in a few seconds.');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [isConfirmed, waitingForPayment, revealFromReceipt]);

  useEffect(() => {
    if (writeError && waitingForPayment) {
      setWaitingForPayment(false);
      setIsOpening(false);
      const msg = writeError.message?.includes('2 mints')
        ? 'You can only mint 2 crates per day. Try again tomorrow!'
        : writeError.message?.slice(0, 120);
      if (msg) alert(msg);
    }
  }, [writeError, waitingForPayment]);

  const handlePressS = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!hasNftContract) {
      alert('NFT contract is loading. Please try again in a moment.');
      return;
    }
    if (mintsRemaining <= 0) {
      alert(`Daily limit reached (${MAX_MINTS_PER_DAY} mints per day). Come back tomorrow!`);
      return;
    }
    if (isOpening || revealedNFT || waitingForPayment || isSending || isConfirming) return;

    try {
      await switchChain({ chainId: base.id });
    } catch {
      alert('Please switch to Base network in your wallet and try again.');
      return;
    }

    if (musicEnabled && !musicStarted) startMusic();
    performOpenAnimation();
    setWaitingForPayment(true);

    writeContract({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: mysticCrateAbi,
      functionName: 'openCrate',
      value: parseEther(OPEN_CRATE_PRICE),
      chainId: base.id,
    });
  };

  const reset = () => {
    setRevealedNFT(null);
    setRarity('');
    setTokenId(null);
    setLastXpGain(null);
    setIsOpening(false);
  };

  const openSeaLink =
    hasNftContract && tokenId
      ? openSeaAssetUrl(NFT_CONTRACT_ADDRESS, tokenId)
      : null;

  return (
    <div className="phone-viewport">
      <div className="phone-scale">
        <div className="phone-frame relative bg-zinc-950 rounded-[60px] border-[18px] border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="h-12 shrink-0 bg-zinc-900 flex items-center justify-between px-3 text-white text-sm border-b border-zinc-700">
          <ConnectWallet />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-purple-400 font-bold">{totalXp} XP</span>
            <button
              type="button"
              onClick={toggleMusic}
              className="text-base leading-none opacity-80 hover:opacity-100"
              aria-label="Toggle music"
            >
              {musicEnabled ? '🔊' : '🔇'}
            </button>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="shrink-0 text-center pt-3 pb-1 border-b border-zinc-800 px-2">
          <h1 className="text-2xl font-bold text-white tracking-wider">MYSTIC CRATE</h1>
          <p className="text-xs text-purple-400 mt-0.5">
            {screen === 'crate' && hasNftContract
              ? `Press S · ${OPEN_CRATE_PRICE} ETH · ${mintsRemaining}/${MAX_MINTS_PER_DAY} mints`
              : screen === 'checkin'
              ? 'Daily check-in rewards'
              : screen === 'spin'
              ? 'Spin the wheel for XP'
              : screen === 'inventory'
              ? 'Your NFTs · trade on OpenSea'
              : 'Top 10 players by XP'}
          </p>
        </div>

        {xpToast && (
          <div className="text-center py-1 text-green-400 text-xs font-medium shrink-0">{xpToast}</div>
        )}

        {(waitingForPayment || isSending || isConfirming) && screen === 'crate' && (
          <div className="text-center py-1 text-yellow-400 text-xs shrink-0">
            {isSending ? 'Confirm mint...' : isConfirming ? 'Minting on Base...' : 'Waiting...'}
          </div>
        )}

        {screen === 'crate' && (
          <div className="shrink-0 bg-zinc-900 py-1.5 px-2 overflow-x-auto">
            <div className="flex justify-center gap-1 min-w-min mx-auto">
              {rarities.map((r) => (
                <div
                  key={r.name}
                  className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-medium text-center"
                  style={{ backgroundColor: r.color + '20', color: r.color }}
                >
                  {r.name} {r.prob}%
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden relative bg-gradient-to-b from-zinc-950 to-black">
          {screen === 'crate' && (
            <div className="h-full flex items-center justify-center p-4">
              {!revealedNFT ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePressS}
                  className="cursor-pointer"
                >
                  <motion.div
                    animate={isOpening ? { scale: [1, 1.15, 0.9, 1.08, 1] } : {}}
                    transition={{ duration: 1.4 }}
                    className="relative w-48 h-48"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-violet-600 rounded-full blur-3xl opacity-70" />
                    <div className="relative w-48 h-48 rounded-full border-8 border-white/30 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">PRESS</div>
                        <div className="text-6xl font-black text-white -mt-1">S</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.3, opacity: 0, rotateY: 90 }}
                  animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                  transition={{ type: 'spring', bounce: 0.35, duration: 0.7 }}
                  className="text-center w-full px-2"
                >
                  <p className="text-sm text-purple-300 mb-1">You pulled a Mystic NFT!</p>
                  <div
                    className="text-4xl font-black mb-2 tracking-wide"
                    style={{
                      background: 'linear-gradient(90deg, #c084fc, #f472b6, #a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {rarity}
                  </div>
                  {tokenId && (
                    <p className="text-xs text-zinc-400 mb-1">Token #{tokenId} · in your wallet</p>
                  )}
                  {lastXpGain != null && lastXpGain > 0 && (
                    <p className="text-sm text-green-400 font-bold mb-3">+{lastXpGain} XP</p>
                  )}
                  <div className="relative w-full max-w-[280px] mx-auto aspect-square">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/60 to-pink-500/60 blur-2xl rounded-3xl" />
                    <Image
                      src={revealedNFT.startsWith('/') ? revealedNFT : `${APP_URL}${revealedNFT}`}
                      alt="Your NFT"
                      fill
                      className="object-contain rounded-2xl border-4 border-purple-400/70 shadow-2xl relative z-10"
                      unoptimized
                      priority
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.src.includes(APP_URL) && revealedNFT.startsWith('/')) {
                          img.src = `${APP_URL}${revealedNFT}`;
                        }
                      }}
                    />
                  </div>
                  <div className="mt-5 flex flex-col items-center gap-2">
                    {openSeaLink && (
                      <a
                        href={openSeaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-2.5 bg-purple-600 text-white font-bold rounded-full text-sm hover:bg-purple-500"
                      >
                        View on OpenSea
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setScreen('inventory');
                      }}
                      className="text-xs text-purple-300 underline"
                    >
                      See in Items →
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="mt-1 px-12 py-3.5 bg-white text-black font-bold rounded-full text-base shadow-lg hover:bg-zinc-100"
                    >
                      PRESS S AGAIN
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {screen === 'checkin' && <CheckInPanel onXpToast={showXpToast} />}
          {screen === 'spin' && <SpinWheelPanel onXpToast={showXpToast} />}
          {screen === 'inventory' && <InventoryPanel />}
          {screen === 'ranks' && (
            <div className="h-full overflow-y-auto p-3">
              <LeaderboardPanel />
            </div>
          )}
        </div>

        <QuickNav active={screen} onChange={setScreen} />
        </div>
      </div>
    </div>
  );
}
