/** Fixed XP per check-in streak day (matches on-chain contract). */
export const CHECK_IN_XP_BY_DAY = [5, 7, 10, 12, 15, 20, 30] as const;

export function checkInXpForDay(day: number): number {
  if (day < 1 || day > 7) return CHECK_IN_XP_BY_DAY[0];
  return CHECK_IN_XP_BY_DAY[day - 1];
}

/** Spin wheel segment labels (visual); on-chain awards 15–30 XP. */
export const SPIN_WHEEL_SEGMENTS = [
  { label: '15 XP', color: '#7c3aed' },
  { label: '18 XP', color: '#db2777' },
  { label: '20 XP', color: '#2563eb' },
  { label: '22 XP', color: '#059669' },
  { label: '25 XP', color: '#d97706' },
  { label: '28 XP', color: '#dc2626' },
  { label: '30 XP', color: '#9333ea' },
  { label: 'Bonus', color: '#4f46e5' },
] as const;
