'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  getAccountSnap, getTrades, getAccounts,
  AccountSnapshot, Trade, Account,
} from '@/lib/api';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ExchangePnlPanel } from '@/components/ExchangePnlPanel';
import { TradingDataPanel } from '@/components/TradingDataPanel';
import {
  ArrowLeft, Wallet, Activity, TrendingUp, Layers, Briefcase, RefreshCw,
} from 'lucide-react';

export default function AccountDetailWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-muted text-sm font-sans">Loading…</div>}>
      <AccountDetailPage />
    </Suspense>
  );
}

function AccountDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const [snap, setSnap]         = useState<AccountSnapshot | null>(null);
  const [account, setAccount]   = useState<Account | null>(null);
  const [trades, setTrades]     = useState<Trade[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    if (!id) return;
    setRefreshing(true);
    Promise.all([
      getAccountSnap(id),
      getTrades(id, 50),
      getAccounts(),
    ])
      .then(([s, t, accs]) => {
        setSnap(s);
        setTrades(t.trades || []);
        setAccount(accs.find(a => a.id === id) || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    refresh();
    const iv = setInterval(() => {
      getAccountSnap(id).then(setSnap).catch(() => {});
    }, 15_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-red font-sans">Missing account id</p>
        <Link href="/admin" className="text-green text-sm font-sans hover:underline">← Back to Overview</Link>
      </div>
    );
  }

  if (loading && !snap) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-surface rounded-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-surface " />)}
          </div>
          <div className="h-64 bg-surface " />
        </div>
      </div>
    );
  }

  if (error || !snap) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-red font-sans">{error || 'Account not found'}</p>
        <Link href="/admin" className="text-green text-sm font-sans hover:underline">← Back to Overview</Link>
      </div>
    );
  }

  const dailyPnl = snap.realized_pnl_24h ?? snap.daily_pnl;
  const pnlSrc   = snap.realized_pnl_24h != null ? 'BINGX 24h' : 'VEVI INTERNAL';
  const closed   = trades.filter(t => !t.is_open);
  const totalClosedPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm font-sans">
        <Link href="/admin" className="text-muted hover:text-text inline-flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> Overview
        </Link>
        <span className="text-muted">/</span>
        <span className="text-text font-medium">{snap.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-sans font-semibold text-2xl text-text">{snap.name}</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded border ${
              snap.is_active
                ? 'bg-green/10 text-green border-green/30'
                : 'bg-elevated text-muted border-border'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${snap.is_active ? 'bg-green animate-pulse-slow' : 'bg-muted'}`} />
              {snap.is_active ? 'Active' : 'Paused'}
            </span>
            {account?.exchange && (
              <span className="text-[10px] font-mono bg-elevated text-muted border border-border rounded px-1.5 py-0.5 uppercase">
                {account.exchange}
              </span>
            )}
          </div>
          <p className="text-muted text-sm font-sans">{snap.email}</p>
        </div>
        <button
          onClick={refresh} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:text-text hover:border-green/40 transition-colors text-sm font-sans cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card label="Balance" icon={<Wallet size={14} />}>
          <span className="font-mono text-xl font-semibold text-text">
            {snap.balance > 0
              ? `$${snap.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </span>
        </Card>
        <Card label={`24h P&L · ${pnlSrc}`} icon={<TrendingUp size={14} />}>
          <span className={`font-mono text-xl font-semibold ${dailyPnl >= 0 ? 'text-green' : 'text-red'}`}>
            {fmtPnl(dailyPnl)}
          </span>
        </Card>
        <Card label="Open Positions" icon={<Layers size={14} />}>
          <span className="font-mono text-xl font-semibold text-text">{snap.open_count}</span>
        </Card>
        <Card label="Trades Today" icon={<Activity size={14} />}>
          <span className="font-mono text-xl font-semibold text-text">{snap.daily_trades}</span>
        </Card>
      </div>

      {/* Exchange-truth realized P&L panel */}
      <ExchangePnlPanel accountId={id} days={7} />

      {/* Trading Data Panel — open positions, orders, history, etc. */}
      <div className="bg-surface border border-border lit p-4 mb-6">
        <TradingDataPanel
          accountId={id}
          exchange={account?.exchange ?? 'bingx'}
          openPositions={snap.open_positions}
          canTrade={true}
          onRefresh={refresh}
        />
      </div>

      {/* Recent Trades (Vevi internal — for cross-reference) */}
      <div className="bg-surface border border-border lit overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-elevated/40">
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-muted" />
            <span className="font-sans font-medium text-sm text-text">Recent Trades (Vevi DB)</span>
            <span className="text-[10px] bg-elevated text-muted border border-border rounded px-1.5 py-0.5 font-mono uppercase">internal</span>
          </div>
          <span className="text-xs text-muted font-sans">
            {closed.length} closed · <span className={totalClosedPnl >= 0 ? 'text-green' : 'text-red'}>
              {fmtPnl(totalClosedPnl)}
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {['Symbol', 'Side', 'Entry', 'Exit', 'P&L', 'Opened', 'Closed'].map(h => (
                  <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closed.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted text-sm">
                    No closed trades.
                  </td>
                </tr>
              )}
              {closed.map(t => {
                const side = t.side === 'buy' ? 'long' : 'short';
                const pnl  = t.pnl ?? 0;
                const sym  = t.symbol.replace('/USDT:USDT', '').replace('/USDC:USDC', '');
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-text">{sym}</td>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border lit p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs font-sans uppercase tracking-wide">{label}</span>
        <span className="text-muted">{icon}</span>
      </div>
      <div className="leading-tight">{children}</div>
    </div>
  );
}
