'use client';
import { useMemo, useState } from 'react';
import { AdminTrade } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { trades: AdminTrade[]; }

export function DailyPnlCalendar({ trades }: Props) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const dailyPnl = useMemo(() => {
    const map: Record<string, number> = {};
    const closed = trades.filter((t) => !t.is_open && t.pnl != null && t.closed_at);
    for (const t of closed) {
      const d = new Date(t.closed_at!);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map[key] = (map[key] ?? 0) + t.pnl!;
    }
    return map;
  }, [trades]);

  const monthLabel = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const firstDay   = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0);  setYear(y => y + 1); } else setMonth(m => m + 1); };

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 rounded-lg bg-surface hover:bg-elevated text-muted hover:text-text transition-colors cursor-pointer">
          <ChevronLeft size={16} />
        </button>
        <span className="font-mono text-sm text-text font-semibold">{monthLabel}</span>
        <button onClick={next} className="p-1.5 rounded-lg bg-surface hover:bg-elevated text-muted hover:text-text transition-colors cursor-pointer">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[11px] font-mono text-muted py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const pnl = dailyPnl[key];
          const isToday = key === todayKey;
          const hasTrades = pnl !== undefined;
          const positive = (pnl ?? 0) >= 0;

          return (
            <div
              key={key}
              className={`
                relative rounded-lg p-1.5 min-h-[56px] flex flex-col
                ${hasTrades
                  ? positive
                    ? 'bg-green/10 border border-green/30'
                    : 'bg-red/10 border border-red/30'
                  : 'bg-surface border border-border'
                }
                ${isToday ? 'ring-1 ring-accent/60' : ''}
              `}
            >
              <span className={`text-[11px] font-mono font-semibold leading-none ${isToday ? 'text-accent' : 'text-muted'}`}>
                {day}
              </span>
              {hasTrades && (
                <span className={`mt-auto text-[11px] font-mono font-semibold leading-tight tabular-nums ${positive ? 'text-green' : 'text-red'}`}>
                  {positive ? '+' : ''}{pnl!.toFixed(2)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green/20 border border-green/30" />
          <span className="text-[11px] text-muted font-sans">Profit day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red/20 border border-red/30" />
          <span className="text-[11px] text-muted font-sans">Loss day</span>
        </div>
      </div>
    </div>
  );
}
