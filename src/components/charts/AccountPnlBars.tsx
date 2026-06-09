'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { AccountSnapshot } from '@/lib/api';

interface Props { accounts: AccountSnapshot[]; }

export function AccountPnlBars({ accounts }: Props) {
  const data = accounts
    .filter((a) => a.is_active)
    .map((a) => ({
      name: a.name.split(' ')[0],
      pnl:  +a.daily_pnl.toFixed(2),
    }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94A3B8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={52}
        />
        <ReferenceLine y={0} stroke="#334155" />
        <Tooltip
          contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Today's P&L"]}
          labelStyle={{ color: '#94A3B8' }}
          cursor={{ fill: '#1E293B' }}
        />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
