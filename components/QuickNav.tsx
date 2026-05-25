'use client';

export type AppScreen = 'crate' | 'checkin' | 'spin' | 'inventory' | 'ranks';

type QuickNavProps = {
  active: AppScreen;
  onChange: (screen: AppScreen) => void;
};

const NAV_ITEMS: { id: AppScreen; label: string; icon: string }[] = [
  { id: 'checkin', label: 'Check-in', icon: '📅' },
  { id: 'spin', label: 'Spin', icon: '🎡' },
  { id: 'crate', label: 'Crate', icon: 'S' },
  { id: 'inventory', label: 'Items', icon: '🎒' },
  { id: 'ranks', label: 'Ranks', icon: '🏆' },
];

export function QuickNav({ active, onChange }: QuickNavProps) {
  return (
    <div className="shrink-0 px-2 py-2 border-t border-zinc-800 bg-zinc-900/95">
      <div className="grid grid-cols-5 gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const isCrate = item.id === 'crate';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 px-0.5 transition ${
                isActive
                  ? isCrate
                    ? 'bg-gradient-to-b from-purple-600 to-pink-600 ring-2 ring-purple-400'
                    : 'bg-purple-600/40 ring-1 ring-purple-400'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              <span
                className={`leading-none ${
                  isCrate ? 'text-xl font-black text-white' : 'text-lg'
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[8px] mt-0.5 font-semibold leading-tight ${
                  isActive ? 'text-white' : 'text-zinc-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
