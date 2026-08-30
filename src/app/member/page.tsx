'use client';
import { useEffect, useState } from 'react';
import { getMyDashboard, getTrades, AccountSnapshot, Trade } from '@/lib/api';
import { fmtPnl } from '@/lib/utils';
import { MetricCard }    from '@/components/ui/MetricCard';
import { PositionCard }  from '@/components/ui/PositionCard';
import { EquityChart }   from '@/components/charts/EquityChart';
import { DailyPnlBars }  from '@/components/charts/DailyPnlBars';
import { TradingDataPanel }  from '@/components/TradingDataPanel';
import { TrendingUp, Layers, Calendar, Wallet } from 'lucide-react';
import { Spotlight } from '@/components/Spotlight';

export default function MemberDashboard() {
  const [data, setData]         = useState<AccountSnapshot | null>(null);
  const [trades, setTrades]     = useState<Trade[]>([]);
  const [error, setError]       = useState('');

  useEffect(() => {
    getMyDashboard().then(setData).catch((e) => setError(e.message));
    const interval = setInterval(() => {
      getMyDashboard().then(setData).catch(() => {});
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.account_id) return;
    getTrades(data.account_id, 200).then((r) => setTrades(r.trades)).catch(() => {});
  }, [data?.account_id]);

  if (error) return (
    <div className="px-6 py-16 text-center">
      <p className="lbl text-red">Connection failed</p>
      <p className="text-secondary text-sm mt-2 max-w-[60ch] mx-auto">{error}</p>
    </div>
  );

  if (!data) return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-r border-border">
            <div className="h-2.5 w-16 bg-border" />
            <div className="h-5 w-24 bg-border mt-2.5" />
          </div>
        ))}
      </div>
      <div className="h-64 border-b border-border" />
    </div>
  );

  const pnlPositive   = data.daily_pnl >= 0;
  const closedTrades  = trades.filter((t) => !t.is_open && t.pnl != null);
  const totalPnl      = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <div>
      {/* ── Status rail. One continuous line of figures divided by hairlines,
             the way a terminal presents state — not four boxes in a grid. ── */}
      <Spotlight className="grid grid-cols-2 md:grid-cols-4 border-b border-border bg-surface lit">
        <div className="border-r border-border">
          <MetricCard
            label="Equity"
            value={data.balance > 0 ? data.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            icon={<Wallet />}
            sub="USDT · BingX"
          />
        </div>
        <div className="md:border-r md:border-border">
          <MetricCard
            label="Daily P&L" value={fmtPnl(data.daily_pnl)}
            positive={pnlPositive}
            sub={`${data.daily_trades} trade${data.daily_trades !== 1 ? 's' : ''} today`}
            icon={<TrendingUp />}
          />
        </div>
        <div className="border-r border-t border-border md:border-t-0">
          <MetricCard
            label="Open" value={String(data.open_count)}
            icon={<Layers />}
            sub="positions"
          />
        </div>
        <div className="border-t border-border md:border-t-0">
          <MetricCard
            label="Total P&L" value={fmtPnl(totalPnl)}
            positive={totalPnl >= 0}
            icon={<Calendar />}
            sub={`${closedTrades.length} closed`}
          />
        </div>
      </Spotlight>

      {/* ── Account line ── */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${data.is_active ? 'bg-green animate-pulse-slow' : 'bg-muted'}`}
            aria-hidden
          />
          <span className="font-mono text-sm text-text truncate">{data.name}</span>
          <span className="lbl">{data.is_active ? 'Active' : 'Paused'}</span>
        </div>
        <span className="lbl">Automated execution paused · manual broadcast only</span>
      </div>

      {/* ── Charts. Divided regions, never boxed. ── */}
      <Spotlight className="grid grid-cols-1 lg:grid-cols-3 border-b border-border">
        <div className="lg:col-span-2 lg:border-r lg:border-border px-4 py-4">
          <div className="flex items-baseline justify-between mb-3">
            <span className="lbl">Equity curve</span>
            <span className={`num text-lg font-semibold ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {fmtPnl(totalPnl)}
            </span>
          </div>
          <EquityChart trades={trades} />
        </div>
        <div className="px-4 py-4 border-t border-border lg:border-t-0">
          <div className="flex items-baseline justify-between mb-3">
            <span className="lbl">Daily P&amp;L</span>
            <span className={`num text-lg font-semibold ${pnlPositive ? 'text-green' : 'text-red'}`}>
              {fmtPnl(data.daily_pnl)}
            </span>
          </div>
          <DailyPnlBars trades={trades} />
        </div>
      </Spotlight>

      {/* ── Open positions ── */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="lbl">Open positions</span>
          <span className="num text-xs text-muted">{data.open_count}</span>
        </div>

        {data.open_positions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {data.open_positions.map((pos) => (
              <div key={pos.symbol} className="border-r border-b border-border row-hover">
                <PositionCard position={pos} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-secondary text-sm">No open positions.</p>
            <p className="text-muted text-xs mt-1">
              Automated execution is paused during the rebuild — trades arrive by manual broadcast.
            </p>
          </div>
        )}
      </div>

      <TradingDataPanel
        accountId={data.account_id}
        exchange="bingx"
        openPositions={data.open_positions}
        canTrade={false}
        onRefresh={() => getMyDashboard().then(setData)}
      />
    </div>
  );
}
