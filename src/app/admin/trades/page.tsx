'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getOverview, getAdminTrades, broadcastTrade, closePosition,
  OverviewResponse, AdminTrade, OpenPosition, BroadcastResult,
} from '@/lib/api';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { Badge }       from '@/components/ui/Badge';
import { EquityChart } from '@/components/charts/EquityChart';
import { Briefcase, Radio, CheckCircle2, XCircle, Loader2, ChevronDown, Download, Shield, X } from 'lucide-react';
import { MANUAL_TRADE_BASES_UNIQUE, toUsdtPerp, isStrategySymbol } from '@/lib/symbols';
import { exportTradesCSV } from '@/lib/csvExport';
import { ExchangePnlPanel } from '@/components/ExchangePnlPanel';
import type { Trade } from '@/lib/api';

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
  const [symbol,     setSymbol]     = useState(SYMBOLS[0]);
  const [side,       setSide]       = useState<'buy' | 'sell'>('buy');
  const [pct,        setPct]        = useState('5');
  const [leverage,   setLeverage]   = useState('20');
  const [orderType,  setOrderType]  = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [sl,         setSl]         = useState('');
  const [tp,         setTp]         = useState('');
  const [loading,    setLoading]    = useState(false);
  const [results,    setResults]    = useState<BroadcastResult[] | null>(null);
  const [error,      setError]      = useState('');

  const submit = async () => {
    const pctVal = parseFloat(pct);
    if (!pct || pctVal <= 0 || pctVal > 100) { setError('Enter a % between 0.1 and 100'); return; }
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setError('Enter a limit price'); return;
    }
    setLoading(true); setError(''); setResults(null);
    try {
      const res = await broadcastTrade({
        symbol,
        side,
        balance_pct:  pctVal,
        leverage:     parseInt(leverage) || 20,
        order_type:   orderType,
        limit_price:  orderType === 'limit' ? parseFloat(limitPrice) : undefined,
        sl:           sl ? parseFloat(sl) : undefined,
        tp:           tp ? parseFloat(tp) : undefined,
      });
      setResults(res.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResults(null); setError(''); };

  const inputCls = 'bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-green/60';

  return (
    <div className="bg-surface border border-border rounded-xl mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-elevated/40">
        <div className="w-2 h-2 rounded-full bg-green animate-pulse-slow" />
        <Radio size={14} className="text-green" />
        <span className="font-mono font-semibold text-sm text-text">Broadcast Trade</span>
        <span className="text-[10px] bg-green/10 text-green border border-green/30 rounded px-1.5 py-0.5 font-mono">ADMIN · ALL ACCOUNTS</span>
        <span className="text-xs text-muted font-sans ml-auto">% sizing scales to each account's balance</span>
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
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}
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

            {/* Direction */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Direction</label>
              <div className="flex gap-1.5">
                {(['buy', 'sell'] as const).map(s => (
                  <button key={s} onClick={() => setSide(s)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-mono font-semibold transition-colors border cursor-pointer ${
                      side === s
                        ? s === 'buy' ? 'bg-green/15 text-green border-green/40' : 'bg-red/15 text-red border-red/40'
                        : 'bg-elevated text-muted border-border hover:text-text'
                    }`}
                  >
                    {s === 'buy' ? '▲ LONG' : '▼ SHORT'}
                  </button>
                ))}
              </div>
            </div>

            {/* % of Balance */}
            <div className="flex flex-col gap-1.5 w-28">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">% of Balance</label>
              <div className="relative">
                <input
                  type="number" value={pct} onChange={e => setPct(e.target.value)}
                  className={`${inputCls} w-full pr-7`}
                  placeholder="5" min="0.1" max="100" step="0.5"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm font-mono pointer-events-none">%</span>
              </div>
            </div>

            {/* Leverage */}
            <div className="flex flex-col gap-1.5 w-24">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Leverage</label>
              <input type="number" value={leverage} onChange={e => setLeverage(e.target.value)}
                className={`${inputCls}`} placeholder="20" />
            </div>

            {/* Order Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Order Type</label>
              <div className="flex gap-1.5">
                {(['market', 'limit'] as const).map(t => (
                  <button key={t} onClick={() => setOrderType(t)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-mono font-semibold uppercase transition-colors border cursor-pointer ${
                      orderType === t
                        ? 'bg-green/15 text-green border-green/40'
                        : 'bg-elevated text-muted border-border hover:text-text'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit Price — only when limit selected */}
            {orderType === 'limit' && (
              <div className="flex flex-col gap-1.5 w-36">
                <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Limit Price</label>
                <input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                  className={`${inputCls}`} placeholder="0.0000" step="any" autoFocus />
              </div>
            )}

            {/* SL */}
            <div className="flex flex-col gap-1.5 w-32">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Stop Loss <span className="normal-case text-muted/60">(opt)</span></label>
              <input type="number" value={sl} onChange={e => setSl(e.target.value)}
                className={`${inputCls}`} placeholder="0.000" />
            </div>

            {/* TP */}
            <div className="flex flex-col gap-1.5 w-32">
              <label className="text-[11px] text-muted font-sans uppercase tracking-wide">Take Profit <span className="normal-case text-muted/60">(opt)</span></label>
              <input type="number" value={tp} onChange={e => setTp(e.target.value)}
                className={`${inputCls}`} placeholder="0.000" />
            </div>

            {/* Submit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-transparent font-sans uppercase tracking-wide select-none">.</label>
              <button onClick={submit} disabled={loading}
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

            {error && <div className="w-full"><p className="text-red text-xs font-sans">{error}</p></div>}
          </div>
        ) : (
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
                <div key={r.account_id}
                  className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border min-w-[200px] ${
                    r.ok ? 'bg-green/5 border-green/20' : 'bg-red/5 border-red/20'
                  }`}
                >
                  {r.ok ? <CheckCircle2 size={14} className="text-green mt-0.5 shrink-0" />
                        : <XCircle     size={14} className="text-red   mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-text text-xs font-medium font-sans">{r.account_name}</p>
                    {r.ok
                      ? <p className="text-muted text-[11px] font-mono">
                          @ {r.price?.toFixed(4)} · {r.contracts} lots
                          {(r as any).usdt_used ? ` · $${(r as any).usdt_used}` : ''}
                        </p>
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
        <LiveTab
          positions={livePositions}
          onRefresh={() => getOverview().then(setOverview).catch(() => {})}
        />
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

// ── Accounts cell — expandable per-account list with close ───────────────────
// Uses fixed positioning so the dropdown escapes the table's overflow-x-auto clip.

function AccountsCell({ group, symbol, onRefresh }: {
  group:     LivePos[];
  symbol:    string;
  onRefresh: () => void;
}) {
  const router  = useRouter();
  const btnRef  = useRef<HTMLButtonElement>(null);
  const [open,      setOpen]      = useState(false);
  const [dropPos,   setDropPos]   = useState({ top: 0, left: 0 });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  function openDrop() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen(o => !o);
    setConfirmId(null);
  }

  function dismiss() { setOpen(false); setConfirmId(null); }

  // Close dropdown on any scroll so it doesn't float away from its anchor
  useEffect(() => {
    if (!open) return;
    const close = () => dismiss();
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [open]);

  async function handleClose(accountId: string) {
    if (confirmId !== accountId) { setConfirmId(accountId); return; }
    setClosingId(accountId);
    setConfirmId(null);
    try {
      await closePosition({ account_id: accountId, symbol });
      dismiss();
      onRefresh();
    } catch (err: any) {
      const msg = (err.message || 'Failed').includes('No open position') ? 'Already closed' : (err.message || 'Failed');
      setErrors(prev => ({ ...prev, [accountId]: msg }));
    } finally {
      setClosingId(null);
    }
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={openDrop}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated border border-border text-xs font-mono font-semibold text-text hover:border-green/40 hover:text-green transition-colors cursor-pointer"
      >
        {group.length}
        <ChevronDown size={10} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* full-screen backdrop */}
          <div className="fixed inset-0 z-40" onClick={dismiss} />

          {/* dropdown — fixed so table overflow-x-auto can't clip it */}
          <div
            style={{ top: dropPos.top, left: dropPos.left }}
            className="fixed z-50 bg-surface border border-border rounded-xl shadow-2xl w-60 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-elevated/40">
              <p className="text-[11px] text-muted font-sans uppercase tracking-wide">
                {group.length} account{group.length !== 1 ? 's' : ''}
              </p>
              <button onClick={dismiss} className="text-muted hover:text-text transition-colors cursor-pointer">
                <X size={12} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-border/30">
              {group.map(pos => (
                <div key={pos.account_id} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-elevated/50 transition-colors">
                  <button
                    onClick={() => { dismiss(); router.push('/admin/accounts'); }}
                    className="text-sm font-sans text-text hover:text-green transition-colors text-left truncate flex-1 cursor-pointer"
                    title="Open account details"
                  >
                    {pos.account_name}
                  </button>
                  {errors[pos.account_id] ? (
                    <span className="text-[10px] text-red font-sans shrink-0">{errors[pos.account_id]}</span>
                  ) : (
                    <button
                      onClick={() => handleClose(pos.account_id)}
                      disabled={closingId === pos.account_id}
                      className={`shrink-0 text-xs font-sans font-medium px-2 py-1 rounded-md border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        confirmId === pos.account_id
                          ? 'bg-red text-white border-red hover:bg-red/90'
                          : 'text-red/70 border-red/30 bg-red/5 hover:bg-red/10 hover:text-red hover:border-red/50'
                      }`}
                    >
                      {closingId === pos.account_id ? '…' : confirmId === pos.account_id ? 'Confirm' : 'Close'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Close-all cell ────────────────────────────────────────────────────────────

function CloseCell({ group, symbol, onRefresh }: {
  group:     LivePos[];
  symbol:    string;
  onRefresh: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error,   setError]   = useState('');

  async function handleClose() {
    if (!confirm) { setConfirm(true); return; }
    setClosing(true);
    setConfirm(false);
    setError('');
    try {
      await Promise.all(
        group.map(pos => closePosition({ account_id: pos.account_id, symbol }))
      );
      onRefresh();
    } catch (err: any) {
      setError(err.message?.includes('No open position') ? 'Already closed' : (err.message || 'Failed'));
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClose}
        disabled={closing}
        onBlur={() => setTimeout(() => setConfirm(false), 200)}
        className={`text-xs font-sans font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
          confirm
            ? 'bg-red text-white border-red hover:bg-red/90'
            : 'text-red/70 border-red/30 bg-red/5 hover:bg-red/10 hover:text-red hover:border-red/50'
        }`}
      >
        {closing ? 'Closing…' : confirm ? `Confirm${group.length > 1 ? ` (${group.length})` : ''}` : 'Close'}
      </button>
      {error && <p className="text-[10px] text-red font-sans">{error}</p>}
    </div>
  );
}

// ── Live tab ──────────────────────────────────────────────────────────────────

function LiveTab({ positions, onRefresh }: { positions: LivePos[]; onRefresh: () => void }) {
  if (positions.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <Briefcase size={28} className="text-muted mx-auto mb-2" />
        <p className="text-muted text-sm font-sans">No open positions across any account.</p>
      </div>
    );
  }

  // Group by symbol so each trading pair shows as one row
  const bySymbol: Record<string, LivePos[]> = {};
  for (const pos of positions) {
    (bySymbol[pos.symbol] ??= []).push(pos);
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-x-auto">
      <table className="w-full text-sm font-sans min-w-[800px]">
        <thead>
          <tr className="border-b border-border">
            {['Symbol', 'Side', 'Entry', 'Current', 'Unreal. P&L', 'SL', 'TP', 'Duration', 'Accounts', 'Close'].map((h) => (
              <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(bySymbol).map(([symbol, group]) => {
            const rep    = group[0];
            const sym    = symbol.replace('/USDT:USDT', '').replace('/USDC:USDC', '');
            const pct    = rep.unrealized_pct;
            const pctPos = pct !== null && pct >= 0;
            // Use earliest opened_at across accounts for duration
            const openedAt = group
              .map(p => p.opened_at)
              .filter(Boolean)
              .sort()[0] ?? null;
            return (
              <tr key={symbol} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="font-mono font-semibold text-text">{sym}</span>
                  <span className="ml-2 text-[10px] bg-green/10 text-green border border-green/20 rounded px-1 py-0.5">OPEN</span>
                </td>
                <td className="px-5 py-3.5"><Badge variant={rep.side as 'long'|'short'}>{rep.side.toUpperCase()}</Badge></td>
                <td className="px-5 py-3.5 font-mono text-text">{fmtPrice(rep.entry)}</td>
                <td className="px-5 py-3.5 font-mono text-text">
                  {rep.current_price ? fmtPrice(rep.current_price) : <span className="text-muted">—</span>}
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
                <td className="px-5 py-3.5 font-mono text-muted">{fmtPrice(rep.sl)}</td>
                <td className="px-5 py-3.5 font-mono text-muted">{rep.tp ? fmtPrice(rep.tp) : '—'}</td>
                <td className="px-5 py-3.5 text-muted text-xs">{duration(openedAt)}</td>
                <td className="px-5 py-3.5">
                  <AccountsCell group={group} symbol={symbol} onRefresh={onRefresh} />
                </td>
                <td className="px-5 py-3.5">
                  <CloseCell group={group} symbol={symbol} onRefresh={onRefresh} />
                </td>
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
  const [selectedAcc, setSelectedAcc] = useState<string>('all');   // 'all' or account_id

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
      {/* Exchange-side truth (BingX) — only shown when an account is selected */}
      {selectedAcc === 'all' ? (
        accounts.length > 0 && (
          <div className="bg-surface border border-yellow/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Shield size={16} className="text-yellow mt-0.5 shrink-0" />
            <div>
              <p className="text-text text-sm font-sans font-medium">
                Exchange-side P&L is per-account
              </p>
              <p className="text-muted text-xs font-sans mt-0.5">
                Pick an account below to see BingX-sourced realized P&L (the source of truth that matches what you see on the exchange directly).
              </p>
            </div>
          </div>
        )
      ) : (
        <ExchangePnlPanel accountId={selectedAcc} days={7} />
      )}

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
