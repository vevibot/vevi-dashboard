'use client';
import { useEffect, useState } from 'react';
import { getMyTrades, Trade } from '@/lib/api';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { Badge }         from '@/components/ui/Badge';
import { EquityChart }   from '@/components/charts/EquityChart';
import { DailyPnlBars }  from '@/components/charts/DailyPnlBars';
import { ListOrdered }   from 'lucide-react';

export default function TradesPage() {
  const [trades, setTrades]   = useState<Trade[]>([]);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTrades(200)
      .then((r) => setTrades(r.trades))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const closed     = trades.filter((t) => !t.is_open);
  const open       = trades.filter((t) => t.is_open);
  const totalPnl   = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-sans font-semibold text-2xl text-text">Trade History</h1>
        <p className="text-muted text-sm font-sans mt-1">
          {closed.length} closed · {open.length} open ·{' '}
          <span className={`font-mono font-medium ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
            {fmtPnl(totalPnl)} total
          </span>
        </p>
      </div>

      {error && <p className="text-red font-sans mb-4">{error}</p>}

      {/* Charts */}
      {!loading && trades.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-muted text-xs font-sans uppercase tracking-wide">Cumulative P&L</p>
                <p className={`font-mono font-semibold text-lg mt-0.5 ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
                  {fmtPnl(totalPnl)}
                </p>
              </div>
              <span className="text-xs text-muted font-sans">{closed.length} closed trades</span>
            </div>
            <EquityChart trades={trades} />
          </div>
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-muted text-xs font-sans uppercase tracking-wide mb-1">Daily Breakdown</p>
            <p className="font-mono text-xs text-muted mb-4">Last 14 days</p>
            <DailyPnlBars trades={trades} />
          </div>
        </div>
      )}

      {/* Trade table */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-surface rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border">
                {['Symbol', 'Side', 'Entry', 'Exit', 'P&L', 'Opened', 'Closed'].map((h) => (
                  <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {open.map((t)    => <TradeRow key={t.id} trade={t} />)}
              {closed.map((t)  => <TradeRow key={t.id} trade={t} />)}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <ListOrdered size={28} className="text-muted mx-auto mb-2" />
                    <p className="text-muted text-sm">No trades recorded yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TradeRow({ trade: t }: { trade: Trade }) {
  const side   = t.side === 'buy' ? 'long' : 'short';
  const pnl    = t.pnl ?? 0;
  const isOpen = Boolean(t.is_open);

  return (
    <tr className="border-b border-border/50 hover:bg-elevated/50 transition-colors duration-100">
      <td className="px-5 py-3.5 font-mono font-medium text-text">
        {t.symbol.replace('/USDT:USDT', '')}
        {isOpen && (
          <span className="ml-2 text-[10px] bg-green/10 text-green border border-green/20 rounded px-1 py-0.5 font-mono">
            OPEN
          </span>
        )}
      </td>
      <td className="px-5 py-3.5"><Badge variant={side}>{side.toUpperCase()}</Badge></td>
      <td className="px-5 py-3.5 font-mono text-text">{fmtPrice(t.entry)}</td>
      <td className="px-5 py-3.5 font-mono text-muted">
        {t.exit_price ? fmtPrice(t.exit_price) : '—'}
      </td>
      <td className="px-5 py-3.5 font-mono">
        {isOpen ? (
          <span className="text-muted">Running</span>
        ) : (
          <span className={`font-semibold ${pnl >= 0 ? 'text-green' : 'text-red'}`}>
            {fmtPnl(pnl)}
          </span>
        )}
      </td>
      <td className="px-5 py-3.5 text-muted text-xs">{fmtDate(t.opened_at)}</td>
      <td className="px-5 py-3.5 text-muted text-xs">{fmtDate(t.closed_at)}</td>
    </tr>
  );
}
