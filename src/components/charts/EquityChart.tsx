'use client';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Trade } from '@/lib/api';
import { EmptyChart } from '@/components/ui/Empty';

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
    // The instrument exists before the first measurement: frame, grid, flat trace.
    return <EmptyChart height={176} label="Awaiting first closed trade" />;
  }

  const latest = data[data.length - 1].pnl;
  const color  = latest >= 0 ? '#3ECF8E' : '#F8536B';

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
          tick={{ fill: '#6B7788', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6B7788', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={52}
        />
        <ReferenceLine y={0} stroke="#1E1E1E" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{ background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: 8, fontSize: 12, color: '#FFFFFF' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cumulative P&L']}
          labelStyle={{ color: '#6B7788' }}
          cursor={{ stroke: '#1E1E1E', strokeWidth: 1 }}
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
