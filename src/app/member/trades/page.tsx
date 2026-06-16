'use client';
import { useEffect, useState } from 'react';
import { getMyDashboard, getMyTrades, AccountSnapshot, Trade, OpenPosition } from '@/lib/api';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { Badge }       from '@/components/ui/Badge';
import { EquityChart } from '@/components/charts/EquityChart';
import { ExchangePnlPanel } from '@/components/ExchangePnlPanel';
import { ListOrdered } from 'lucide-react';

type Tab = 'live' | 'history';

function duration(openedAt: string | null): string {
  if (!openedAt) return '—';
  const ms   = Date.now() - new Date(openedAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
}

export default function TradesPage() {
  const [tab, setTab]       = useState<Tab>('live');
  const [snap, setSnap]     = useState<AccountSnapshot | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyDashboard(),
      getMyTrades(200),
    ])
      .then(([s, r]) => { setSnap(s); setTrades(r.trades); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    const iv = setInterval(() => {
      getMyDashboard().then(setSnap).catch(() => {});
    }, 15_000);
    return () => clearInterval(iv);
  }, []);

  const closed   = trades.filter((t) => !t.is_open);
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const live     = snap?.open_positions ?? [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-sans font-semibold text-2xl text-text">Trades</h1>
          <p className="text-muted text-sm font-sans mt-1">
            {live.length} live &middot; {closed.length} closed &middot;{' '}
            <span className={`font-mono font-medium ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {fmtPnl(totalPnl)} realized
            </span>
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-surface border border-border rounded-lg p-1 gap-1">
          {(['live', 'history'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-sans font-medium transition-colors ${
                tab === t
                  ? 'bg-green/10 text-green border border-green/20'
                  : 'text-muted hover:text-text'
              }`}
            >
              {t === 'live' ? `Live (${live.length})` : `History (${closed.length})`}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red font-sans mb-4">{error}</p>}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-surface rounded-lg" />)}
        </div>
      ) : tab === 'live' ? (
        <LiveTab positions={live} />
      ) : (
        <HistoryTab trades={closed} totalPnl={totalPnl} allTrades={trades} />
      )}
    </div>
  );
}

// ── Live tab ──────────────────────────────────────────────────────────────────

function LiveTab({ positions }: { positions: OpenPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <ListOrdered size={28} className="text-muted mx-auto mb-2" />
        <p className="text-muted text-sm font-sans">No open positions right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-x-auto">
      <table className="w-full text-sm font-sans min-w-[700px]">
        <thead>
          <tr className="border-b border-border">
            {['Symbol', 'Side', 'Entry', 'Current', 'Unreal. P&L', 'SL', 'TP', 'Duration'].map((h) => (
              <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const pct     = pos.unrealized_pct;
            const pctPos  = pct !== null && pct >= 0;
            const sym     = pos.symbol.replace('/USDT:USDT', '').replace('/USDC:USDC', '');
            return (
              <tr key={pos.symbol} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                <td className="px-5 py-3.5 font-mono font-medium text-text">
                  {sym}
                  <span className="ml-2 text-[10px] bg-green/10 text-green border border-green/20 rounded px-1 py-0.5">OPEN</span>
                </td>
                <td className="px-5 py-3.5"><Badge variant={pos.side as 'long'|'short'}>{pos.side.toUpperCase()}</Badge></td>
                <td className="px-5 py-3.5 font-mono text-text">{fmtPrice(pos.entry)}</td>
                <td className="px-5 py-3.5 font-mono text-text">
                  {pos.current_price ? fmtPrice(pos.current_price) : <span className="text-muted">—</span>}
                </td>
                <td className="px-5 py-3.5 font-mono">
                  {pct !== null ? (
                    <span className={`font-semibold ${pctPos ? 'text-green' : 'text-red'}`}>
                      {pctPos ? '+' : ''}{pct.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-muted text-xs">syncing…</span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-mono text-muted">{fmtPrice(pos.sl)}</td>
                <td className="px-5 py-3.5 font-mono text-muted">{pos.tp ? fmtPrice(pos.tp) : '—'}</td>
                <td className="px-5 py-3.5 text-muted text-xs">{duration(pos.opened_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────

function HistoryTab({ trades, totalPnl, allTrades }: { trades: Trade[]; totalPnl: number; allTrades: Trade[] }) {
  return (
    <>
      {/* Exchange-side truth — sourced from BingX directly */}
      <ExchangePnlPanel days={7} />

      {allTrades.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted text-xs font-sans uppercase tracking-wide">Vevi Cumulative P&L (internal)</p>
              <p className={`font-mono font-semibold text-lg mt-0.5 ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtPnl(totalPnl)}
              </p>
            </div>
            <span className="text-xs text-muted font-sans">{trades.length} closed trades</span>
          </div>
          <EquityChart trades={allTrades} />
        </div>
      )}

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
            {trades.map((t) => {
              const side = t.side === 'buy' ? 'long' : 'short';
              const pnl  = t.pnl ?? 0;
              return (
                <tr key={t.id} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-medium text-text">
                    {t.symbol.replace('/USDT:USDT', '').replace('/USDC:USDC', '')}
                  </td>
                  <td className="px-5 py-3.5"><Badge variant={side}>{side.toUpperCase()}</Badge></td>
                  <td className="px-5 py-3.5 font-mono text-text">{fmtPrice(t.entry)}</td>
                  <td className="px-5 py-3.5 font-mono text-muted">{t.exit_price ? fmtPrice(t.exit_price) : '—'}</td>
                  <td className="px-5 py-3.5 font-mono">
                    <span className={`font-semibold ${pnl >= 0 ? 'text-green' : 'text-red'}`}>{fmtPnl(pnl)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted text-xs">{fmtDate(t.opened_at)}</td>
                  <td className="px-5 py-3.5 text-muted text-xs">{fmtDate(t.closed_at)}</td>
                </tr>
              );
            })}
            {trades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <ListOrdered size={28} className="text-muted mx-auto mb-2" />
                  <p className="text-muted text-sm">No closed trades yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
