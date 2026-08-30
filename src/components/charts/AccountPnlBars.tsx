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
    .map((a) => {
      // Prefer BingX-sourced 24h realized PnL; fall back to Vevi internal.
      const raw = a.realized_pnl_24h != null ? a.realized_pnl_24h : a.daily_pnl;
      return {
        name: a.name.split(' ')[0],
        pnl:  Number.isFinite(raw) ? +Number(raw).toFixed(2) : 0,
      };
    });

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: '#6B7788', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6B7788', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={52}
        />
        <ReferenceLine y={0} stroke="#1E1E1E" />
        <Tooltip
          contentStyle={{ background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: 8, fontSize: 12, color: '#FFFFFF' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Today's P&L"]}
          labelStyle={{ color: '#6B7788' }}
          cursor={{ fill: '#141414' }}
        />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? '#3ECF8E' : '#F8536B'} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
