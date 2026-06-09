'use client';
import { useEffect, useState } from 'react';
import { getMyDashboard, getTrades, AccountSnapshot, Trade, canTrade } from '@/lib/api';
import { fmtPnl } from '@/lib/utils';
import { MetricCard }    from '@/components/ui/MetricCard';
import { PositionCard }  from '@/components/ui/PositionCard';
import { EquityChart }   from '@/components/charts/EquityChart';
import { DailyPnlBars }  from '@/components/charts/DailyPnlBars';
import { TradeModal }    from '@/components/TradeModal';
import { TrendingUp, Layers, Calendar } from 'lucide-react';

function exchangeFromSymbol(sym: string): string {
  return sym.includes('USDC') ? 'hyperliquid' : 'bingx';
}

export default function MemberDashboard() {
  const [data, setData]         = useState<AccountSnapshot | null>(null);
  const [trades, setTrades]     = useState<Trade[]>([]);
  const [error, setError]       = useState('');
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);

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
    <div className="p-8 flex items-center justify-center h-64">
      <p className="text-red font-sans">{error}</p>
    </div>
  );

  if (!data) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-surface rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-surface rounded-xl" />)}
        </div>
        <div className="h-56 bg-surface rounded-xl" />
      </div>
    </div>
  );

  const pnlPositive   = data.daily_pnl >= 0;
  const closedTrades  = trades.filter((t) => !t.is_open && t.pnl != null);
  const totalPnl      = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-sans font-semibold text-2xl text-text">Dashboard</h1>
        <p className="text-muted text-sm font-sans mt-1">
          {data.name} &mdash;{' '}
          <span className={`font-mono ${data.is_active ? 'text-green' : 'text-muted'}`}>
            {data.is_active ? '● Active' : '○ Paused'}
          </span>
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Daily P&L" value={fmtPnl(data.daily_pnl)}
          positive={pnlPositive}
          sub={`${data.daily_trades} trade${data.daily_trades !== 1 ? 's' : ''} today`}
          icon={<TrendingUp size={16} />}
        />
        <MetricCard
          label="Open Positions" value={String(data.open_count)}
          icon={<Layers size={16} />}
          sub="Currently running"
        />
        <MetricCard
          label="Total P&L" value={fmtPnl(totalPnl)}
          positive={totalPnl >= 0}
          icon={<Calendar size={16} />}
          sub={`${closedTrades.length} closed trades`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Equity curve — takes 2/3 width */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted text-xs font-sans uppercase tracking-wide">Equity Curve</p>
              <p className={`font-mono font-semibold text-lg mt-0.5 ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtPnl(totalPnl)}
              </p>
            </div>
            <span className="text-xs text-muted font-sans">{closedTrades.length} trades</span>
          </div>
          <EquityChart trades={trades} />
        </div>

        {/* Daily P&L bars — 1/3 width */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="mb-4">
            <p className="text-muted text-xs font-sans uppercase tracking-wide">Daily P&L</p>
            <p className={`font-mono font-semibold text-lg mt-0.5 ${pnlPositive ? 'text-green' : 'text-red'}`}>
              {fmtPnl(data.daily_pnl)}
            </p>
          </div>
          <DailyPnlBars trades={trades} />
        </div>
      </div>

      {/* Open positions */}
      <div>
        <h2 className="font-sans font-medium text-text mb-4">
          Open Positions
          <span className="ml-2 font-mono text-sm text-muted">({data.open_count})</span>
        </h2>

        {data.open_positions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.open_positions.map((pos) => (
              <PositionCard key={pos.symbol} position={pos} onTrade={setTradeSymbol} />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <Layers size={32} className="text-muted mx-auto mb-3" />
            <p className="text-muted font-sans text-sm">No open positions — bot is scanning for setups</p>
          </div>
        )}
      </div>

      {tradeSymbol && (
        <TradeModal
          accountId={data.account_id}
          symbol={tradeSymbol}
          exchange={exchangeFromSymbol(tradeSymbol)}
          canTrade={canTrade()}
          onClose={() => setTradeSymbol(null)}
          onDone={() => getMyDashboard().then(setData)}
        />
      )}
    </div>
  );
}
