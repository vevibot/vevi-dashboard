'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  getActivity, getAccounts, getAccountSnap,
  Account, AccountSnapshot,
} from '@/lib/api';
import {
  fetchAllTickers, fetchAllKlines, symbolToBinance,
  TickerData, KlineCandle,
} from '@/lib/marketData';
import { SymbolPanel } from '@/components/SymbolPanel';
import { Activity as ActivityIcon, RefreshCw, ChevronDown } from 'lucide-react';

interface SymActivity { status: string; bias: number; detail: string; updated_at: string; }
type ActivityData = Record<string, Record<string, SymActivity>>;

export default function ActivityPage() {
  const [activity, setActivity]       = useState<ActivityData>({});
  const [accounts, setAccounts]       = useState<Account[]>([]);
  const [selectedAcc, setSelectedAcc] = useState<string | null>(null);
  const [snap, setSnap]               = useState<AccountSnapshot | null>(null);
  const [tickers, setTickers]         = useState<Record<string, TickerData>>({});
  const [klines, setKlines]           = useState<Record<string, KlineCandle[]>>({});
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  // ── poll activity + accounts every 15s ─────────────────────────────────────
  const loadAccountData = async () => {
    setRefreshing(true);
    try {
      const [a, ac] = await Promise.all([getActivity(), getAccounts()]);
      setActivity(a as ActivityData);
      setAccounts(ac);
      if (!selectedAcc) {
        const firstActive = ac.find(x => x.is_active) ?? ac[0];
        if (firstActive) setSelectedAcc(firstActive.id);
      }
      setLoading(false);
    } catch (_) {
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAccountData();
    const t = setInterval(loadAccountData, 15_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── snapshot for selected account (positions) ──────────────────────────────
  useEffect(() => {
    if (!selectedAcc) return;
    getAccountSnap(selectedAcc).then(setSnap).catch(() => setSnap(null));
    const t = setInterval(
      () => getAccountSnap(selectedAcc).then(setSnap).catch(() => {}),
      15_000,
    );
    return () => clearInterval(t);
  }, [selectedAcc]);

  // ── live prices + sparklines for symbols in this account ───────────────────
  const symbolsForAccount = useMemo(() => {
    if (!selectedAcc) return [] as string[];
    return Object.keys(activity[selectedAcc] || {});
  }, [selectedAcc, activity]);

  useEffect(() => {
    if (symbolsForAccount.length === 0) return;
    const binanceSyms = symbolsForAccount.map(symbolToBinance);

    // initial fetch (both)
    Promise.all([fetchAllTickers(binanceSyms), fetchAllKlines(binanceSyms)])
      .then(([t, k]) => { setTickers(t); setKlines(k); })
      .catch(() => {});

    // price refresh every 5s (klines refresh every 60s)
    const priceTimer = setInterval(
      () => fetchAllTickers(binanceSyms).then(setTickers).catch(() => {}),
      5_000,
    );
    const klineTimer = setInterval(
      () => fetchAllKlines(binanceSyms).then(setKlines).catch(() => {}),
      60_000,
    );
    return () => { clearInterval(priceTimer); clearInterval(klineTimer); };
  }, [symbolsForAccount]);

  const currentAccount = accounts.find(a => a.id === selectedAcc) || null;
  const currentActivity = (selectedAcc && activity[selectedAcc]) || {};

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-40 bg-surface rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-muted text-sm">No accounts found — add one from the Accounts page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-sans font-semibold text-2xl text-text">Activity</h1>
          <p className="text-muted text-sm font-sans mt-1">
            Live bot status per symbol · prices refresh every 5s · activity every 15s
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Account dropdown */}
          <div className="relative">
            <select
              value={selectedAcc || ''}
              onChange={(e) => setSelectedAcc(e.target.value)}
              className="appearance-none bg-surface border border-border rounded-lg pl-3 pr-9 py-2 text-text font-sans text-sm cursor-pointer
                         focus:outline-none focus:border-green/50 hover:border-text/30 transition-colors"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} className="bg-surface">
                  {a.name} {a.is_active ? '· Active' : '· Paused'}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>

          <button
            onClick={loadAccountData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 text-muted hover:text-text hover:border-text/30 transition-colors cursor-pointer text-sm disabled:opacity-50"
            title="Refresh activity"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Summary stats strip ────────────────────────────────────────────── */}
      {currentAccount && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Status"
            value={currentAccount.is_active ? '● LIVE' : '○ PAUSED'}
            color={currentAccount.is_active ? 'text-green' : 'text-muted'}
          />
          <StatCard
            label="Daily P&L"
            value={`${(snap?.daily_pnl ?? 0) >= 0 ? '+' : ''}$${(snap?.daily_pnl ?? 0).toFixed(2)}`}
            color={(snap?.daily_pnl ?? 0) >= 0 ? 'text-green' : 'text-red'}
          />
          <StatCard
            label="Open Positions"
            value={String(snap?.open_count ?? 0)}
            color="text-text"
          />
          <StatCard
            label="Trades Today"
            value={String(snap?.daily_trades ?? 0)}
            color="text-text"
          />
        </div>
      )}

      {/* ── Symbol grid ────────────────────────────────────────────────────── */}
      {symbolsForAccount.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <ActivityIcon size={32} className="text-muted/40 mx-auto mb-3" />
          <p className="text-muted text-sm">
            {currentAccount?.is_active
              ? 'No bot activity yet — waiting for first scan cycle.'
              : 'This account is paused — bot is not scanning.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {symbolsForAccount.map(sym => {
            const binanceSym = symbolToBinance(sym);
            const base = sym.split('/')[0];
            const openPos = snap?.open_positions?.find(p => p.symbol === sym);
            return (
              <SymbolPanel
                key={sym}
                symbol={base}
                ticker={tickers[binanceSym] || null}
                klines={klines[binanceSym] || []}
                activity={currentActivity[sym]}
                openPosition={openPos}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-muted text-[10px] uppercase tracking-wider mb-1 font-sans">{label}</p>
      <p className={`font-mono font-semibold text-base ${color}`}>{value}</p>
    </div>
  );
}
