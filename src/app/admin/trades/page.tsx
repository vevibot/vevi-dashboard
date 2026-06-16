'use client';
import { useEffect, useState } from 'react';
import {
  getOverview, getAdminTrades, broadcastTrade,
  OverviewResponse, AdminTrade, OpenPosition, BroadcastResult,
} from '@/lib/api';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { Badge }       from '@/components/ui/Badge';
import { EquityChart } from '@/components/charts/EquityChart';
import { Briefcase, Radio, CheckCircle2, XCircle, Loader2, ChevronDown, Download } from 'lucide-react';
import { MANUAL_TRADE_BASES_UNIQUE, toUsdtPerp, isStrategySymbol } from '@/lib/symbols';
import { exportTradesCSV } from '@/lib/csvExport';
import type { Trade } from '@/lib/api';
import { useState as useReactState } from 'react';

// Broadcast trade picker — full manual catalogue, not limited to strategy 10.
const SYMBOLS = MANUAL_TRADE_BASES_UNIQUE.map(toUsdtPerp);

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

interface LivePos extends OpenPosition { account_name: string; account_id: string; }

// ── Broadcast panel ───────────────────────────────────────────────────────────

function BroadcastPanel() {
  const [symbol,   setSymbol]   = useState(SYMBOLS[0]);
  const [side,     setSide]     = useState<'buy' | 'sell'>('buy');
  const [amount,   setAmount]   = useState('10');
  const [leverage, setLeverage] = useState('20');
  const [sl,       setSl]       = useState('');
  const [tp,       setTp]       = useState('');
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState<BroadcastResult[] | null>(null);
  const [error,    setError]    = useState('');

  const submit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true); setError(''); setResults(null);
    try {
      const res = await broadcastTrade({
        symbol,
        side,
        usdt_amount: parseFloat(amount),
        leverage:    parseInt(leverage) || 20,
        sl:          sl ? parseFloat(sl) : undefined,
        tp:          tp ? parseFloat(tp) : undefined,
      });
      setResults(res.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResults(null); setError(''); };

  return (
    <div className="bg-surface border border-border rounded-xl mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-elevated/40">
        <div className="w-2 h-2 rounded-full bg-green animate-pulse-slow" />
        <Radio size={14} className="text-green" />
        <span className="font-mono font-semibold text-sm text-text">Broadcast Trade</span>
        <span className="text-[10px] bg-green/10 text-green border border-green/30 rounded px-1.5 py-0.5 font-mono">ADMIN · ALL ACCOUNTS</span>
        <span className="text-xs text-muted font-sans ml-auto">Places the same trade simultaneously on every active account</span>
      </div>

      <div className="p-5">
        {!results ? (
          <div className="flex flex-wrap gap-4 items-end">

            {/* Symbol */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Symbol</label>
              <div className="relative">
                <select
                  value={symbol} onChange={e => setSymbol(e.target.value)}
                  className="appearance-none w-full bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-green/60 pr-8 cursor-pointer"
                >
                  {SYMBOLS.map(s => {
                    const base = s.split('/')[0];
                    const tag  = isStrategySymbol(base) ? ' · bot' : '';
                    return <option key={s} value={s}>{base}{tag}</option>;
                  })}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>

            {/* Side */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Direction</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSide('buy')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-mono font-semibold transition-colors border cursor-pointer ${
                    side === 'buy'
                      ? 'bg-green/15 text-green border-green/40'
                      : 'bg-elevated text-muted border-border hover:text-text'
                  }`}
                >
                  ▲ LONG
                </button>
                <button
                  onClick={() => setSide('sell')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-mono font-semibold transition-colors border cursor-pointer ${
                    side === 'sell'
                      ? 'bg-red/15 text-red border-red/40'
                      : 'bg-elevated text-muted border-border hover:text-text'
                  }`}
                >
                  ▼ SHORT
                </button>
              </div>
            </div>

            {/* USDT Amount */}
            <div className="flex flex-col gap-1.5 w-28">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">USDT Amount</label>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-green/60"
                placeholder="10"
              />
            </div>

            {/* Leverage */}
            <div className="flex flex-col gap-1.5 w-24">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Leverage</label>
              <input
                type="number" value={leverage} onChange={e => setLeverage(e.target.value)}
                className="bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-green/60"
                placeholder="20"
              />
            </div>

            {/* SL */}
            <div className="flex flex-col gap-1.5 w-32">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Stop Loss <span className="normal-case text-muted/60">(opt)</span></label>
              <input
                type="number" value={sl} onChange={e => setSl(e.target.value)}
                className="bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-green/60"
                placeholder="0.000"
              />
            </div>

            {/* TP */}
            <div className="flex flex-col gap-1.5 w-32">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Take Profit <span className="normal-case text-muted/60">(opt)</span></label>
              <input
                type="number" value={tp} onChange={e => setTp(e.target.value)}
                className="bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-green/60"
                placeholder="0.000"
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-transparent font-sans uppercase tracking-wide select-none">.</label>
              <button
                onClick={submit} disabled={loading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-mono font-semibold text-sm transition-colors border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  side === 'buy'
                    ? 'bg-green/15 text-green border-green/40 hover:bg-green/25'
                    : 'bg-red/15 text-red border-red/40 hover:bg-red/25'
                }`}
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Placing…</>
                  : <><Radio size={14} /> Broadcast {side === 'buy' ? 'LONG' : 'SHORT'}</>
                }
              </button>
            </div>

            {error && (
              <div className="w-full mt-1">
                <p className="text-red text-xs font-sans">{error}</p>
              </div>
            )}
          </div>
        ) : (
          /* Results */
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-sans text-text">
                Placed on{' '}
                <span className="text-green font-mono font-semibold">{results.filter(r => r.ok).length}</span>
                {' '}/ {results.length} accounts
              </p>
              <button onClick={reset} className="text-xs text-muted hover:text-text font-sans transition-colors cursor-pointer underline underline-offset-2">
                New trade
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {results.map(r => (
                <div
                  key={r.account_id}
                  className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border min-w-[200px] ${
                    r.ok ? 'bg-green/5 border-green/20' : 'bg-red/5 border-red/20'
                  }`}
                >
                  {r.ok
                    ? <CheckCircle2 size={14} className="text-green mt-0.5 shrink-0" />
                    : <XCircle     size={14} className="text-red   mt-0.5 shrink-0" />
                  }
                  <div>
                    <p className="text-text text-xs font-medium font-sans">{r.account_name}</p>
                    {r.ok
                      ? <p className="text-muted text-[11px] font-mono">@ {r.price?.toFixed(4)} · {r.contracts} lots</p>
                      : <p className="text-red text-[11px] font-sans">{r.error}</p>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminTradesPage() {
  const [tab,      setTab]      = useState<Tab>('live');
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [trades,   setTrades]   = useState<AdminTrade[]>([]);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getAdminTrades(200)])
      .then(([ov, tr]) => { setOverview(ov); setTrades(tr.trades); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    const iv = setInterval(() => {
      getOverview().then(setOverview).catch(() => {});
    }, 15_000);
    return () => clearInterval(iv);
  }, []);

  const livePositions: LivePos[] = (overview?.accounts ?? []).flatMap((acc) =>
    acc.open_positions.map((pos) => ({ ...pos, account_name: acc.name, account_id: acc.account_id }))
  );

  const closed   = trades.filter((t) => !t.is_open);
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <div className="p-4 md:p-8">
      {/* Page header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-sans font-semibold text-2xl text-text">Trades</h1>
          <p className="text-muted text-sm font-sans mt-1">
            {livePositions.length} live &middot; {closed.length} closed &middot;{' '}
            <span className={`font-mono font-medium ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {fmtPnl(totalPnl)} realized
            </span>
          </p>
        </div>
        <div className="flex items-center bg-surface border border-border rounded-lg p-1 gap-1">
          {(['live', 'history'] as Tab[]).map((t) => (
            <button
              key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-sans font-medium transition-colors cursor-pointer ${
                tab === t ? 'bg-green/10 text-green border border-green/20' : 'text-muted hover:text-text'
              }`}
            >
              {t === 'live' ? `Live (${livePositions.length})` : `History (${closed.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Broadcast panel — always visible at top */}
      <BroadcastPanel />

      {error && <p className="text-red font-sans mb-4">{error}</p>}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-surface rounded-lg" />)}
        </div>
      ) : tab === 'live' ? (
        <LiveTab positions={livePositions} />
      ) : (
        <HistoryTab
          trades={closed}
          allTrades={trades}
          accounts={(overview?.accounts ?? []).map(a => ({ id: a.account_id, name: a.name, email: a.email }))}
        />
      )}
    </div>
  );
}

// ── Live tab ──────────────────────────────────────────────────────────────────

function LiveTab({ positions }: { positions: LivePos[] }) {
  if (positions.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <Briefcase size={28} className="text-muted mx-auto mb-2" />
        <p className="text-muted text-sm font-sans">No open positions across any account.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-x-auto">
      <table className="w-full text-sm font-sans min-w-[800px]">
        <thead>
          <tr className="border-b border-border">
            {['Account', 'Symbol', 'Side', 'Entry', 'Current', 'Unreal. P&L', 'SL', 'TP', 'Duration'].map((h) => (
              <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const pct    = pos.unrealized_pct;
            const pctPos = pct !== null && pct >= 0;
            const sym    = pos.symbol.replace('/USDT:USDT', '').replace('/USDC:USDC', '');
            return (
              <tr key={`${pos.account_id}-${pos.symbol}`} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                <td className="px-5 py-3.5 text-text text-sm font-sans">{pos.account_name}</td>
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

interface AcctOpt { id: string; name: string; email: string; }

function HistoryTab({ trades, allTrades, accounts }: {
  trades: AdminTrade[];
  allTrades: AdminTrade[];
  accounts: AcctOpt[];
}) {
  const [selectedAcc, setSelectedAcc] = useReactState<string>('all');   // 'all' or account_id

  // Filter both the closed-trade list and the all-trade (for equity chart)
  const filteredClosed = selectedAcc === 'all'
    ? trades
    : trades.filter(t => t.account_id === selectedAcc);
  const filteredAll = selectedAcc === 'all'
    ? allTrades
    : allTrades.filter(t => t.account_id === selectedAcc);
  const filteredPnl = filteredClosed.reduce((s, t) => s + (t.pnl ?? 0), 0);

  const selectedAcct = accounts.find(a => a.id === selectedAcc);
  const headerLabel  = selectedAcc === 'all' ? 'All Accounts' : (selectedAcct?.name ?? '—');

  function downloadCSV() {
    if (filteredClosed.length === 0) return;
    const meta = {
      accountName:  selectedAcc === 'all' ? 'all-accounts' : (selectedAcct?.name ?? 'account'),
      accountEmail: selectedAcc === 'all' ? '(combined across all accounts)' : (selectedAcct?.email ?? ''),
      exporterRole: 'admin' as const,
    };
    // exportTradesCSV expects Trade[], AdminTrade extends Trade so it's compatible.
    exportTradesCSV(filteredClosed as unknown as Trade[], meta);
  }

  return (
    <>
      {/* Account picker + summary card */}
      {allTrades.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-muted text-[11px] font-sans uppercase tracking-wide">Filter:</span>
              <button
                onClick={() => setSelectedAcc('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer border ${
                  selectedAcc === 'all'
                    ? 'bg-green/10 border-green/40 text-green'
                    : 'bg-elevated border-border text-muted hover:text-text'
                }`}
              >
                All Accounts ({allTrades.filter(t => !t.is_open).length})
              </button>
              {accounts.map(a => {
                const n = trades.filter(t => t.account_id === a.id).length;
                if (n === 0) return null;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAcc(a.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer border ${
                      selectedAcc === a.id
                        ? 'bg-green/10 border-green/40 text-green'
                        : 'bg-elevated border-border text-muted hover:text-text'
                    }`}
                  >
                    {a.name} ({n})
                  </button>
                );
              })}
            </div>
            <button
              onClick={downloadCSV}
              disabled={filteredClosed.length === 0}
              title="Download filtered trades as CSV with PnL summary (tax)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium bg-elevated text-text border border-border hover:border-green/40 hover:text-green transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Download size={13} /> CSV
            </button>
          </div>

          <div className="flex items-center justify-between mb-4 pt-3 border-t border-border/40">
            <div>
              <p className="text-muted text-xs font-sans uppercase tracking-wide">
                Cumulative P&L — {headerLabel}
              </p>
              <p className={`font-mono font-semibold text-lg mt-0.5 ${filteredPnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtPnl(filteredPnl)}
              </p>
            </div>
            <span className="text-xs text-muted font-sans">{filteredClosed.length} closed trades</span>
          </div>
          <EquityChart trades={filteredAll} />
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm font-sans min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              {['Account', 'Symbol', 'Side', 'Entry', 'Exit', 'P&L', 'Opened', 'Closed'].map((h) => (
                <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClosed.map((t) => {
              const side = t.side === 'buy' ? 'long' : 'short';
              const pnl  = t.pnl ?? 0;
              return (
                <tr key={t.id} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                  <td className="px-5 py-3.5 text-text text-sm font-sans">{t.account_name}</td>
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
            {filteredClosed.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <Briefcase size={28} className="text-muted mx-auto mb-2" />
                  <p className="text-muted text-sm">
                    No closed trades {selectedAcc === 'all' ? 'yet' : `for ${headerLabel}`}.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
