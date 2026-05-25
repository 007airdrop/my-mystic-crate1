'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { decodeEventLog } from 'viem';
import { mysticCrateAbi, NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { SPIN_WHEEL_SEGMENTS } from '@/lib/xp-config';

type SpinWheelPanelProps = {
  onXpToast: (msg: string) => void;
};

export function SpinWheelPanel({ onXpToast }: SpinWheelPanelProps) {
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({ hash });
  const { canSpin, refetch } = usePlayerStats();

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [resultXp, setResultXp] = useState<number | null>(null);

  const segmentAngle = 360 / SPIN_WHEEL_SEGMENTS.length;

  useEffect(() => {
    if (!isSuccess || !receipt) return;
    let xp = 20;
    for (const log of receipt.logs) {
      try {
        const d = decodeEventLog({ abi: mysticCrateAbi, data: log.data, topics: log.topics });
        if (d.eventName === 'DailySpin') {
          xp = Number(d.args.xpAwarded);
          break;
        }
      } catch {
        continue;
      }
    }
    setResultXp(xp);
    setSpinning(false);
    void refetch();
    onXpToast(`You won +${xp} XP!`);
  }, [isSuccess, receipt, refetch, onXpToast]);

  useEffect(() => {
    if (error) {
      setSpinning(false);
      onXpToast('Spin failed — try again');
    }
  }, [error, onXpToast]);

  const handleSpin = async () => {
    if (!canSpin || spinning || !NFT_CONTRACT_ADDRESS.startsWith('0x')) return;
    setResultXp(null);
    setSpinning(true);
    setRotation((r) => r + 1440 + Math.floor(Math.random() * 360));

    try {
      await switchChain({ chainId: base.id });
    } catch {
      setSpinning(false);
      alert('Switch to Base network.');
      return;
    }

    writeContract({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: mysticCrateAbi,
      functionName: 'dailySpin',
      chainId: base.id,
    });
  };

  const busy = isPending || confirming || spinning;

  const wheelBg = `conic-gradient(${SPIN_WHEEL_SEGMENTS.map(
    (s, i) => `${s.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`,
  ).join(', ')})`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3">
      <p className="text-purple-300 font-bold text-sm mb-2">🎡 Daily Spin Wheel</p>
      <p className="text-zinc-400 text-[10px] mb-3 text-center">Free once per day · Win 15–30 XP</p>

      <div className="relative w-52 h-52 mb-4">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-2xl">▼</div>
        <motion.div
          className="w-full h-full rounded-full border-4 border-purple-500 shadow-lg shadow-purple-500/30"
          style={{ background: wheelBg }}
          animate={{ rotate: rotation }}
          transition={{ duration: spinning ? 3 : 0, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-purple-400 flex items-center justify-center text-2xl">
            🎡
          </div>
        </div>
      </div>

      {resultXp != null && (
        <p className="text-green-400 font-bold text-lg mb-2 animate-pulse">+{resultXp} XP!</p>
      )}

      <button
        type="button"
        disabled={!canSpin || busy}
        onClick={handleSpin}
        className="px-10 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-sm disabled:opacity-40 hover:from-pink-500 hover:to-purple-500 transition"
      >
        {busy ? 'Spinning...' : canSpin ? 'SPIN NOW' : 'Come back tomorrow'}
      </button>
    </div>
  );
}
