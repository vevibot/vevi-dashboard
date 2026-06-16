'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getOverview, OverviewResponse, AccountSnapshot, getAccounts, Account } from '@/lib/api';
import { fmtPnl } from '@/lib/utils';
import { MetricCard }       from '@/components/ui/MetricCard';
import { AccountPnlBars }   from '@/components/charts/AccountPnlBars';
import { TradingDataPanel } from '@/components/TradingDataPanel';
import { Users, Activity, TrendingUp, Layers, ChevronDown, ChevronRight, Wallet, RefreshCw } from 'lucide-react';

export default function AdminOverview() {
  const [data, setData]           = useState<OverviewResponse | null>(null);
  const [error, setError]         = useState('');
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([getOverview(), getAccounts()])
      .then(([ov, ac]) => { setData(ov); setAccounts(ac); })
      .catch((e) => setError(e.message))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      getOverview().then(setData).catch(() => {});
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <PageError msg={error} />;
  if (!data)  return <PageLoading />;

  // Prefer BingX-sourced 24h realized PnL (matches what user sees on exchange).
  // Falls back to Vevi internal daily_pnl only when exchange unreachable.
  const displayPnl = data.total_realized_pnl_24h != null
    ? data.total_realized_pnl_24h
    : data.total_daily_pnl;
  const pnlSource  = data.total_realized_pnl_24h != null ? 'BINGX 24h' : 'VEVI INTERNAL';
  const pnlPositive = displayPnl >= 0;
  const totalOpen   = data.accounts.reduce((s, a) => s + a.open_count, 0);
  const activeAccs  = data.accounts.filter((a) => a.is_active);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-sans font-semibold text-2xl text-text">Overview</h1>
          <p className="text-muted text-sm font-sans mt-1">Real-time across all managed accounts</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:text-text hover:border-green/40 transition-colors text-sm font-sans cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
        <MetricCard label="Total Accounts"  value={String(data.total_accounts)}  icon={<Users size={16} />} />
        <MetricCard label="Active Accounts" value={String(data.active_accounts)} icon={<Activity size={16} />} />

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted text-sm font-sans">Total Balance</span>
            <Wallet size={14} className="text-muted" />
          </div>
          <span className="font-mono text-xl md:text-2xl font-semibold text-text leading-tight break-all">
            {data.total_balance > 0 ? `$${data.total_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </span>
        </div>

        <div className="relative">
          <MetricCard
            label={`Daily P&L · ${pnlSource}`}
            value={fmtPnl(displayPnl)}
            positive={pnlPositive}
            icon={<TrendingUp size={16} />}
          />
        </div>
        <MetricCard label="Open Positions" value={String(totalOpen)} icon={<Layers size={16} />} />
      </div>


      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Account P&L bars — uses BingX 24h realized data when available */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-muted text-xs font-sans uppercase tracking-wide">24h P&L by Account</p>
              <p className={`font-mono font-semibold text-lg mt-0.5 ${pnlPositive ? 'text-green' : 'text-red'}`}>
                {fmtPnl(displayPnl)}
              </p>
            </div>
            <span className="text-[9px] font-mono text-muted">{pnlSource}</span>
          </div>
          <AccountPnlBars accounts={data.accounts} />
        </div>

        {/* Active accounts breakdown */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <p className="text-muted text-xs font-sans uppercase tracking-wide mb-4">Active Accounts Snapshot</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeAccs.map((acc) => (
              <Link
                href={`/admin/accounts/detail?id=${acc.account_id}`}
                key={acc.account_id}
                className="bg-elevated rounded-lg p-3 flex items-start gap-3 cursor-pointer hover:bg-elevated/70 border border-transparent hover:border-green/30 transition-colors group"
              >
                <div className="w-2 h-2 rounded-full bg-green mt-1.5 animate-pulse flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-text font-medium text-sm truncate group-hover:text-green transition-colors">{acc.name}</p>
                    <ChevronRight size={14} className="text-muted group-hover:text-green shrink-0 transition-colors" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {acc.balance > 0 && (
                      <span className="font-mono text-xs text-text font-semibold">
                        ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className={`font-mono text-xs font-semibold ${(acc.realized_pnl_24h ?? acc.daily_pnl) >= 0 ? 'text-green' : 'text-red'}`}>
                      {fmtPnl(acc.realized_pnl_24h ?? acc.daily_pnl)}
                    </span>
                    <span className="text-muted text-xs">{acc.open_count} open</span>
                    <span className="text-muted text-xs">{acc.daily_trades} trades</span>
                  </div>
                </div>
              </Link>
            ))}
            {activeAccs.length === 0 && (
              <div className="col-span-2 py-6 text-center text-muted text-sm">
                No active accounts
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full accounts list */}
      <div>
        <h2 className="font-sans font-medium text-text mb-4">All Accounts</h2>

        {/* Mobile: card layout (<md) */}
        <div className="md:hidden space-y-3">
          {data.accounts.map((acc) => {
            const isOpen = expanded === acc.account_id;
            const fullAcc = accounts.find(a => a.id === acc.account_id);
            return (
              <div key={acc.account_id} className="bg-surface border border-border rounded-xl overflow-hidden">
                <div
                  onClick={() => setExpanded(isOpen ? null : acc.account_id)}
                  className="p-4 active:bg-elevated/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-text font-medium truncate">{acc.name}</p>
                      <p className="text-muted text-xs truncate">{acc.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${acc.is_active ? 'bg-green/10 text-green border-green/30' : 'bg-slate-500/10 text-muted border-slate-600/30'}`}>
                      <span className={`w-1 h-1 rounded-full ${acc.is_active ? 'bg-green animate-pulse-slow' : 'bg-slate-500'}`} />
                      {acc.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/40">
                    <div>
                      <p className="text-muted text-[9px] uppercase tracking-wide mb-0.5">Balance</p>
                      <p className="font-mono font-semibold text-xs text-text">
                        {acc.balance > 0 ? `$${acc.balance.toFixed(2)}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted text-[9px] uppercase tracking-wide mb-0.5">P&L</p>
                      <p className={`font-mono font-semibold text-xs ${(acc.realized_pnl_24h ?? acc.daily_pnl) >= 0 ? 'text-green' : 'text-red'}`}>
                        {fmtPnl(acc.realized_pnl_24h ?? acc.daily_pnl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted text-[9px] uppercase tracking-wide mb-0.5">Open</p>
                      <p className="font-mono font-semibold text-xs text-text">{acc.open_count}</p>
                    </div>
                    <div>
                      <p className="text-muted text-[9px] uppercase tracking-wide mb-0.5">Trades</p>
                      <p className="font-mono font-semibold text-xs text-text">{acc.daily_trades}</p>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-border/50 bg-elevated/20 p-3">
                    <TradingDataPanel
                      accountId={acc.account_id}
                      exchange={fullAcc?.exchange ?? 'bingx'}
                      openPositions={acc.open_positions}
                      canTrade={true}
                      onRefresh={() => getOverview().then(setData)}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {data.accounts.length === 0 && (
            <div className="bg-surface border border-border rounded-xl px-5 py-12 text-center text-muted text-sm">
              No accounts yet — add one from the Accounts page.
            </div>
          )}
        </div>

        {/* Desktop: table layout (≥md) */}
        <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border">
                {['Account', 'Status', 'Balance', 'Daily P&L', 'Open Pos', 'Trades Today'].map((h) => (
                  <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((acc) => {
                const isOpen = expanded === acc.account_id;
                const fullAcc = accounts.find(a => a.id === acc.account_id);
                return (
                  <>
                    <tr
                      key={acc.account_id}
                      onClick={() => setExpanded(isOpen ? null : acc.account_id)}
                      className="border-b border-border/50 hover:bg-elevated/50 transition-colors duration-100 cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={14} className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          <div>
                            <p className="text-text font-medium">{acc.name}</p>
                            <p className="text-muted text-xs">{acc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded border ${acc.is_active ? 'bg-green/10 text-green border-green/30' : 'bg-slate-500/10 text-muted border-slate-600/30'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${acc.is_active ? 'bg-green animate-pulse-slow' : 'bg-slate-500'}`} />
                          {acc.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-text">
                        {acc.balance > 0 ? `$${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <span className={(acc.realized_pnl_24h ?? acc.daily_pnl) >= 0 ? 'text-green' : 'text-red'}>
                          {fmtPnl(acc.realized_pnl_24h ?? acc.daily_pnl)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-text">{acc.open_count}</td>
                      <td className="px-5 py-3.5 font-mono text-text">{acc.daily_trades}</td>
                    </tr>
                    {isOpen && (
                      <tr key={`${acc.account_id}-panel`} className="border-b border-border/50 bg-elevated/20">
                        <td colSpan={6} className="p-4">
                          <TradingDataPanel
                            accountId={acc.account_id}
                            exchange={fullAcc?.exchange ?? 'bingx'}
                            openPositions={acc.open_positions}
                            canTrade={true}
                            onRefresh={() => getOverview().then(setData)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {data.accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted text-sm">
                    No accounts yet — add one from the Accounts page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="p-4 md:p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-surface rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-surface rounded-xl" />)}
        </div>
        <div className="h-48 bg-surface rounded-xl" />
      </div>
    </div>
  );
}

function PageError({ msg }: { msg: string }) {
  return (
    <div className="p-8 flex items-center justify-center h-64">
      <p className="text-red font-sans">{msg}</p>
    </div>
  );
}
