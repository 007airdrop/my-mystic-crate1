'use client';

import { useEffect, useState } from 'react';
import { useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { decodeEventLog, parseEther } from 'viem';
import {
  mysticCrateAbi,
  NFT_CONTRACT_ADDRESS,
  DAILY_ACTION_PRICE,
} from '@/lib/contracts';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { CHECK_IN_XP_BY_DAY, checkInXpForDay } from '@/lib/xp-config';

type CheckInPanelProps = {
  onXpToast: (msg: string) => void;
};

function msUntilUtcMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function CheckInPanel({ onXpToast }: CheckInPanelProps) {
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({ hash });
  const { streak, canCheckIn, refetch } = usePlayerStats();
  const [countdown, setCountdown] = useState(formatCountdown(msUntilUtcMidnight()));

  const nextDay = canCheckIn ? (streak >= 7 ? 1 : streak + 1) : Math.max(streak, 1);

  useEffect(() => {
    const t = setInterval(() => setCountdown(formatCountdown(msUntilUtcMidnight())), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isSuccess || !receipt) return;
    let xp = checkInXpForDay(nextDay);
    for (const log of receipt.logs) {
      try {
        const d = decodeEventLog({ abi: mysticCrateAbi, data: log.data, topics: log.topics });
        if (d.eventName === 'DailyCheckIn') {
          xp = Number(d.args.xpAwarded);
          break;
        }
      } catch {
        continue;
      }
    }
    void refetch();
    onXpToast(`Day ${nextDay} check-in! +${xp} XP`);
  }, [isSuccess, receipt, nextDay, refetch, onXpToast]);

  useEffect(() => {
    if (error) onXpToast('Check-in failed — try again');
  }, [error, onXpToast]);

  const claim = async () => {
    if (!NFT_CONTRACT_ADDRESS.startsWith('0x')) return;
    try {
      await switchChain({ chainId: base.id });
    } catch {
      alert('Switch to Base network.');
      return;
    }
    writeContract({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: mysticCrateAbi,
      functionName: 'dailyCheckIn',
      value: parseEther(DAILY_ACTION_PRICE),
      chainId: base.id,
    });
  };

  const busy = isPending || confirming;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2">
      <div className="w-full max-w-[340px] rounded-2xl bg-gradient-to-b from-emerald-900/90 to-emerald-950 border border-emerald-600/50 p-3 shadow-xl">
        <div className="bg-emerald-800 rounded-xl py-2 px-3 text-center mb-3">
          <h2 className="text-white font-bold text-lg">Daily Check-In</h2>
        </div>

        <div className="flex gap-1.5">
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {CHECK_IN_XP_BY_DAY.slice(0, 6).map((xp, i) => {
              const day = i + 1;
              const done = canCheckIn ? day < nextDay : day <= streak;
              const current = canCheckIn && day === nextDay;
              const isRock = day <= 3;
              return (
                <div
                  key={day}
                  className={`relative rounded-lg p-1.5 text-center border-2 ${
                    current
                      ? 'border-yellow-400 bg-emerald-700/80 ring-2 ring-yellow-300/50'
                      : done
                      ? 'border-emerald-400 bg-emerald-800/60 opacity-80'
                      : 'border-emerald-700/50 bg-emerald-900/40'
                  }`}
                >
                  {done && (
                    <span className="absolute top-0.5 right-0.5 text-green-300 text-xs">✓</span>
                  )}
                  {current && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  )}
                  <div className="text-xl">{isRock ? '🪨' : '🐚'}</div>
                  <p className="text-[9px] text-emerald-200">Day {day}</p>
                  <p className="text-[10px] font-bold text-white">{xp} XP</p>
                </div>
              );
            })}
          </div>
          <div
            className={`w-16 shrink-0 rounded-lg p-1.5 flex flex-col items-center justify-center border-2 ${
              canCheckIn && nextDay === 7
                ? 'border-yellow-400 bg-emerald-700/80'
                : streak >= 7 && !canCheckIn
                ? 'border-emerald-400 bg-emerald-800/60'
                : 'border-emerald-700/50 bg-emerald-900/40'
            }`}
          >
            <div className="text-2xl">🏆</div>
            <p className="text-[9px] text-emerald-200 mt-1">Day 7</p>
            <p className="text-xs font-bold text-yellow-300">{CHECK_IN_XP_BY_DAY[6]} XP</p>
          </div>
        </div>

        <p className="text-center text-[10px] text-emerald-300/80 mt-3">* Resets in {countdown}</p>

        <button
          type="button"
          disabled={!canCheckIn || busy}
          onClick={claim}
          className="w-full mt-3 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {busy
            ? 'Confirm in wallet...'
            : canCheckIn
            ? `Claim Day ${nextDay} · ${checkInXpForDay(nextDay)} XP · ${DAILY_ACTION_PRICE} ETH`
            : 'Checked in today ✓'}
        </button>
      </div>
    </div>
  );
}
