'use client';
import { useEffect, useState } from 'react';
import { getAdminTrades, AdminTrade } from '@/lib/api';
import { DailyPnlCalendar } from '@/components/charts/DailyPnlCalendar';
import { DailyPnlBars }    from '@/components/charts/DailyPnlBars';

export default function PnlCalendarPage() {
  const [trades, setTrades] = useState<AdminTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminTrades(500)
      .then(r => { setTrades(r.trades); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const closed   = trades.filter(t => !t.is_open && t.pnl != null);
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const wins     = closed.filter(t => (t.pnl ?? 0) > 0).length;
  const wr       = closed.length > 0 ? (wins / closed.length * 100).toFixed(1) : '—';

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 bg-surface rounded-lg" />
        <div className="h-96 bg-surface rounded-xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 flex items-center justify-center h-64">
      <p className="text-red font-sans">{error}</p>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-sans font-semibold text-2xl text-text">P&L Calendar</h1>
        <p className="text-muted text-sm font-sans mt-1">Daily profit & loss across all accounts</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-muted text-xs font-sans uppercase tracking-wide mb-1">Total P&L</p>
          <p className={`font-mono font-semibold text-xl ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-muted text-xs font-sans uppercase tracking-wide mb-1">Closed Trades</p>
          <p className="font-mono font-semibold text-xl text-text">{closed.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-muted text-xs font-sans uppercase tracking-wide mb-1">Win Rate</p>
          <p className="font-mono font-semibold text-xl text-text">{wr}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar — takes 3 cols */}
        <div className="lg:col-span-3 bg-surface border border-border rounded-xl p-5">
          <p className="text-muted text-xs font-sans uppercase tracking-wide mb-4">Monthly View</p>
          <DailyPnlCalendar trades={trades} />
        </div>

        {/* Bar chart — takes 2 cols */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <p className="text-muted text-xs font-sans uppercase tracking-wide mb-4">Last 14 Days</p>
          <DailyPnlBars trades={trades} />

          {/* Recent closed trades */}
          <div className="mt-5">
            <p className="text-muted text-xs font-sans uppercase tracking-wide mb-3">Recent Trades</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {closed.slice(0, 20).map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs font-mono bg-elevated rounded-lg px-3 py-2">
                  <div>
                    <span className="text-text font-medium">{t.symbol.split('/')[0]}</span>
                    <span className={`ml-2 ${t.side === 'long' ? 'text-green' : 'text-red'}`}>{t.side.toUpperCase()}</span>
                  </div>
                  <span className={`font-semibold ${(t.pnl ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                    {(t.pnl ?? 0) >= 0 ? '+' : ''}${(t.pnl ?? 0).toFixed(3)}
                  </span>
                </div>
              ))}
              {closed.length === 0 && (
                <p className="text-muted text-xs text-center py-4">No closed trades yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
