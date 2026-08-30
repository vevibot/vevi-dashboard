'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Trade } from '@/lib/api';
import { EmptyChart } from '@/components/ui/Empty';

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

  if (data.length === 0) {
    // Returning null here collapsed the panel to a bare header — the region must
    // hold its shape whether or not it has a signal yet.
    return <EmptyChart height={110} label="No daily P&L yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fill: '#6B7788', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6B7788', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={48}
        />
        <Tooltip
          contentStyle={{ background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: 8, fontSize: 12, color: '#FFFFFF' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, 'Daily P&L']}
          labelStyle={{ color: '#6B7788' }}
          cursor={{ fill: '#141414' }}
        />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={32}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? '#3ECF8E' : '#F8536B'} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
