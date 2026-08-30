'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyDashboard, getMyTrades, AccountSnapshot, Trade, OpenPosition } from '@/lib/api';
import { Empty } from '@/components/ui/Empty';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { Badge }       from '@/components/ui/Badge';
import { EquityChart } from '@/components/charts/EquityChart';
import { ExchangePnlPanel } from '@/components/ExchangePnlPanel';
import { exportTradesCSV } from '@/lib/csvExport';
import {
  TradeFilterBar, SortTh, baseOf, DATE_MS,
  type SortKey, type SortDir, type DirFilter, type DateFilter,
} from '@/components/TradeFilters';
import { ListOrdered, Download } from 'lucide-react';

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
      // Poll closed trades too so History updates live without a reload.
      getMyTrades(200).then((r) => setTrades(r.trades)).catch(() => {});
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
        <HistoryTab trades={closed} allTrades={trades} account={snap} />
      )}
    </div>
  );
}

// ── Live tab ──────────────────────────────────────────────────────────────────

function LiveTab({ positions }: { positions: OpenPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="border-b border-border">
        <Empty
          waiting
          title="No open positions"
          detail="Trades arrive by manual broadcast while automated execution is paused."
        />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-x-auto">
      <table className="w-full text-sm font-sans min-w-[700px]">
        <thead>
          <tr className="border-b border-border">
            {['Symbol', 'Side', 'Entry', 'Current', 'Unreal. P&L', 'SL', 'TP', 'Duration'].map((h) => {
              const num = ['Entry', 'Current', 'Unreal. P&L', 'SL', 'TP'].includes(h);
              return <th key={h} className={`text-muted text-xs font-medium px-5 py-3 ${num ? 'text-right' : 'text-left'}`}>{h}</th>;
            })}
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
                <td className="px-5 py-3.5 font-mono text-text text-right tabular-nums">{fmtPrice(pos.entry)}</td>
                <td className="px-5 py-3.5 font-mono text-text text-right tabular-nums">
                  {pos.current_price ? fmtPrice(pos.current_price) : <span className="text-muted">—</span>}
                </td>
                <td className="px-5 py-3.5 font-mono text-right tabular-nums">
                  {pct !== null ? (
                    <span className={`font-semibold ${pctPos ? 'text-green' : 'text-red'}`}>
                      {pctPos ? '+' : ''}{pct.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-muted text-xs">syncing…</span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-mono text-muted text-right tabular-nums">{fmtPrice(pos.sl)}</td>
                <td className="px-5 py-3.5 font-mono text-muted text-right tabular-nums">{pos.tp ? fmtPrice(pos.tp) : '—'}</td>
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

function HistoryTab({ trades, allTrades, account }: {
  trades: Trade[]; allTrades: Trade[]; account: AccountSnapshot | null;
}) {
  const router = useRouter();
  const [symFilter, setSymFilter]   = useState('all');
  const [dirFilter, setDirFilter]   = useState<DirFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'opened', dir: 'desc' });

  const symbolOptions = Array.from(new Set(trades.map(t => baseOf(t.symbol)))).sort();
  const dateCut = dateFilter === 'all' ? 0 : Date.now() - DATE_MS[dateFilter];
  const matches = (t: Trade) =>
    (symFilter === 'all' || baseOf(t.symbol) === symFilter) &&
    (dirFilter === 'all' || t.side === dirFilter) &&
    (dateCut === 0 || new Date(t.closed_at ?? t.opened_at).getTime() >= dateCut);

  const filtered = trades.filter(matches);
  const filteredPnl = filtered.reduce((s, t) => s + (t.pnl ?? 0), 0);

  const sorted = [...filtered].sort((a, b) => {
    let av: number | string, bv: number | string;
    if (sort.key === 'pnl')          { av = a.pnl ?? 0; bv = b.pnl ?? 0; }
    else if (sort.key === 'symbol')  { av = baseOf(a.symbol); bv = baseOf(b.symbol); }
    else                             { av = new Date(a.opened_at).getTime(); bv = new Date(b.opened_at).getTime(); }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  function downloadCSV() {
    if (sorted.length === 0) return;
    exportTradesCSV(sorted, {
      accountName:  account?.name ?? 'account',
      accountEmail: account?.email ?? '',
      exporterRole: 'member',
    });
  }

  const filtersActive = symFilter !== 'all' || dirFilter !== 'all' || dateFilter !== 'all';

  return (
    <>
      {/* Exchange-side truth — sourced from BingX directly */}
      <ExchangePnlPanel days={7} />

      {allTrades.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted text-xs font-sans uppercase tracking-wide">Vevi Cumulative P&L (internal)</p>
              <p className={`font-mono font-semibold text-lg mt-0.5 ${filteredPnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtPnl(filteredPnl)}
              </p>
            </div>
            <span className="text-xs text-muted font-sans">{filtered.length} closed trades</span>
          </div>
          <EquityChart trades={filtered} />
        </div>
      )}

      {/* Symbol / direction / date filter bar + CSV export */}
      <TradeFilterBar
        symbols={symbolOptions}
        sym={symFilter} setSym={setSymFilter}
        dir={dirFilter} setDir={setDirFilter}
        date={dateFilter} setDate={setDateFilter}
        count={filtered.length}
        extra={
          <button
            onClick={downloadCSV}
            disabled={sorted.length === 0}
            title="Download filtered trades as CSV with PnL summary (tax)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium bg-elevated text-text border border-border hover:border-green/40 hover:text-green transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Download size={13} /> CSV
          </button>
        }
      />

      <div className="bg-surface border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm font-sans min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <SortTh label="Symbol" col="symbol" sort={sort} setSort={setSort} />
              <th className="text-muted text-xs font-medium px-5 py-3 text-left">Side</th>
              <th className="text-muted text-xs font-medium px-5 py-3 text-right">Entry</th>
              <th className="text-muted text-xs font-medium px-5 py-3 text-right">Exit</th>
              <SortTh label="P&L" col="pnl" sort={sort} setSort={setSort} align="right" />
              <SortTh label="Opened" col="opened" sort={sort} setSort={setSort} />
              <th className="text-muted text-xs font-medium px-5 py-3 text-left">Closed</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const side = t.side === 'buy' ? 'long' : 'short';
              const pnl  = t.pnl ?? 0;
              return (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/member/charts?symbol=${baseOf(t.symbol)}&trade=${t.id}`)}
                  title="Open on charts"
                  className="border-b border-border/50 hover:bg-elevated/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-mono font-medium text-text">
                    {baseOf(t.symbol)}
                  </td>
                  <td className="px-5 py-3.5"><Badge variant={side}>{side.toUpperCase()}</Badge></td>
                  <td className="px-5 py-3.5 font-mono text-text text-right tabular-nums">{fmtPrice(t.entry)}</td>
                  <td className="px-5 py-3.5 font-mono text-muted text-right tabular-nums">{t.exit_price ? fmtPrice(t.exit_price) : '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-right tabular-nums">
                    <span className={`font-semibold ${pnl >= 0 ? 'text-green' : 'text-red'}`}>{fmtPnl(pnl)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted text-xs">{fmtDate(t.opened_at)}</td>
                  <td className="px-5 py-3.5 text-muted text-xs">{fmtDate(t.closed_at)}</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7}>
                  {filtersActive ? (
                    <Empty compact title="No trades match these filters" detail="Clear a filter to widen the result." />
                  ) : (
                    <Empty compact waiting title="No closed trades yet" detail="Your first closed trade starts the record." />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
