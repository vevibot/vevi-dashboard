'use client';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Trade } from '@/lib/api';

interface Props { trades: Trade[]; }

export function EquityChart({ trades }: Props) {
  const closed = trades
    .filter((t) => !t.is_open && t.pnl != null && t.closed_at)
    .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());

  let running = 0;
  const data = closed.map((t) => {
    running += t.pnl!;
    return {
      label: new Date(t.closed_at!).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
      pnl: +running.toFixed(2),
    };
  });

  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-muted text-sm font-sans">
        No closed trades yet
      </div>
    );
  }

  const latest = data[data.length - 1].pnl;
  const color  = latest >= 0 ? '#22C55E' : '#EF4444';

  return (
    <ResponsiveContainer width="100%" height={176}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fill: '#94A3B8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#94A3B8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={52}
        />
        <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cumulative P&L']}
          labelStyle={{ color: '#94A3B8' }}
          cursor={{ stroke: '#334155', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke={color}
          strokeWidth={2}
          fill="url(#equityGrad)"
          dot={false}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
