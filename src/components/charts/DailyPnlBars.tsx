'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Trade } from '@/lib/api';

interface Props { trades: Trade[]; }

export function DailyPnlBars({ trades }: Props) {
  const closed = trades.filter((t) => !t.is_open && t.pnl != null && t.closed_at);

  const byDay: Record<string, number> = {};
  for (const t of closed) {
    const day = new Date(t.closed_at!).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
    byDay[day] = (byDay[day] ?? 0) + t.pnl!;
  }

  const data = Object.entries(byDay)
    .map(([day, pnl]) => ({ day, pnl: +pnl.toFixed(2) }))
    .slice(-14);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fill: '#94A3B8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94A3B8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={48}
        />
        <Tooltip
          contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, 'Daily P&L']}
          labelStyle={{ color: '#94A3B8' }}
          cursor={{ fill: '#1E293B' }}
        />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={32}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
