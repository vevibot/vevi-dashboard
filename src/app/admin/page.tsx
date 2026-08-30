'use client';
import { Fragment, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getOverview, OverviewResponse, AccountSnapshot, getAccounts, Account } from '@/lib/api';
import { fmtPnl } from '@/lib/utils';
import { MetricCard }       from '@/components/ui/MetricCard';
import { Empty }            from '@/components/ui/Empty';
import { Spotlight }        from '@/components/Spotlight';
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
    <div>
      {/* ── The desk's horizon: same rule and light as every other surface. ── */}
      <div className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 620, height: 300, top: '-160%',
            background: 'radial-gradient(circle, rgba(62,207,142,.11), transparent 68%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(62,207,142,.55) 30%,rgba(62,207,142,.55) 70%,transparent)' }}
        />
        <div className="relative flex items-center justify-between gap-4 px-4 py-2.5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm text-text">Overview</span>
            <span className="lbl">All managed accounts · live</span>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-b from-float to-elevated border border-border text-muted text-xs font-sans shadow-rim
                       transition-[color,border-color] duration-150 ease-out cursor-pointer disabled:opacity-50
                       [@media(hover:hover)]:hover:text-text [@media(hover:hover)]:hover:border-border-lit active:scale-[.98] motion-reduce:active:scale-100"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Status rail: one line of figures divided by hairlines. ── */}
      <Spotlight className="grid grid-cols-2 md:grid-cols-5 border-b border-border bg-surface lit">
        <div className="border-r border-border">
          <MetricCard label="Accounts" value={String(data.total_accounts)} icon={<Users />} sub={`${data.active_accounts} active`} />
        </div>
        <div className="md:border-r md:border-border">
          <MetricCard label="Active" value={String(data.active_accounts)} icon={<Activity />} sub="receiving broadcasts" />
        </div>
        <div className="border-r border-border border-t md:border-t-0">
          <MetricCard
            label="Balance"
            value={data.total_balance > 0 ? data.total_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            icon={<Wallet />} sub="USDT combined"
          />
        </div>
        <div className="md:border-r md:border-border border-t md:border-t-0">
          <MetricCard
            label={`Daily P&L · ${pnlSource}`}
            value={fmtPnl(displayPnl)}
            positive={pnlPositive}
            icon={<TrendingUp />}
          />
        </div>
        <div className="border-t md:border-t-0 border-border col-span-2 md:col-span-1">
          <MetricCard label="Open" value={String(totalOpen)} icon={<Layers />} sub="positions" />
        </div>
      </Spotlight>

      {/* ── P&L by account · active snapshot: divided regions. ── */}
      <Spotlight className="grid grid-cols-1 lg:grid-cols-3 border-b border-border">
        <div className="px-4 py-4 lg:border-r lg:border-border">
          <div className="flex items-baseline justify-between mb-3">
            <span className="lbl">24h P&L by account</span>
            <span className="text-[9px] font-mono text-muted">{pnlSource}</span>
          </div>
          <AccountPnlBars accounts={data.accounts} />
        </div>

        <div className="lg:col-span-2 border-t border-border lg:border-t-0">
          <div className="px-4 py-2 border-b border-border-soft">
            <span className="lbl">Active accounts</span>
          </div>
          {activeAccs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {activeAccs.map((acc, i) => (
                <Link
                  href={`/admin/accounts/detail?id=${acc.account_id}`}
                  key={acc.account_id}
                  className={`row-hover flex items-start gap-3 px-4 py-3 border-b border-border-soft group
                              ${i % 2 === 0 ? 'sm:border-r sm:border-border-soft' : ''}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green mt-1.5 animate-pulse-slow shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-text font-medium text-sm truncate">{acc.name}</p>
                      <ChevronRight size={13} className="text-muted shrink-0 transition-transform duration-150 [@media(hover:hover)]:group-hover:translate-x-0.5" />
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {acc.balance > 0 && (
                        <span className="num text-xs text-text font-semibold">
                          {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className={`num text-xs font-semibold ${(acc.realized_pnl_24h ?? acc.daily_pnl) >= 0 ? 'text-green' : 'text-red'}`}>
                        {fmtPnl(acc.realized_pnl_24h ?? acc.daily_pnl)}
                      </span>
                      <span className="text-muted text-xs">{acc.open_count} open</span>
                      <span className="text-muted text-xs">{acc.daily_trades} trades</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty compact title="No active accounts" detail="Activate an account from the Accounts page to include it in broadcasts." />
          )}
        </div>
      </Spotlight>

      {/* ── All accounts ── */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="lbl">All accounts</span>
          <span className="num text-xs text-muted">{data.accounts.length}</span>
        </div>

        {/* Mobile: stacked rows (<md) */}
        <div className="md:hidden">
          {data.accounts.map((acc) => {
            const isOpen = expanded === acc.account_id;
            const fullAcc = accounts.find(a => a.id === acc.account_id);
            return (
              <div key={acc.account_id} className="border-b border-border-soft">
                <div
                  onClick={() => setExpanded(isOpen ? null : acc.account_id)}
                  className="px-4 py-3 pressable cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-text font-medium text-sm truncate">{acc.name}</p>
                      <p className="text-muted text-xs truncate">{acc.email}</p>
                    </div>
                    <StatusChip active={acc.is_active} />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <MiniStat label="Balance" value={acc.balance > 0 ? acc.balance.toFixed(2) : '—'} />
                    <MiniStat
                      label="P&L"
                      value={fmtPnl(acc.realized_pnl_24h ?? acc.daily_pnl)}
                      tone={(acc.realized_pnl_24h ?? acc.daily_pnl) >= 0 ? 'up' : 'down'}
                    />
                    <MiniStat label="Open" value={String(acc.open_count)} />
                    <MiniStat label="Trades" value={String(acc.daily_trades)} />
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-border-soft bg-bg px-3 py-3">
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
            <Empty title="No accounts yet" detail="Add the first one from the Accounts page." />
          )}
        </div>

        {/* Desktop: dense table (≥md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border">
                {['Account', 'Status', 'Balance', 'Daily P&L', 'Open', 'Trades'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 lbl font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((acc) => {
                const isOpen = expanded === acc.account_id;
                const fullAcc = accounts.find(a => a.id === acc.account_id);
                return (
                  <Fragment key={acc.account_id}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : acc.account_id)}
                      className="border-b border-border-soft row-hover cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={13} className={`text-muted transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`} />
                          <div>
                            <p className="text-text font-medium">{acc.name}</p>
                            <p className="text-muted text-xs">{acc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusChip active={acc.is_active} /></td>
                      <td className="px-4 py-3 num text-text">
                        {acc.balance > 0 ? acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-4 py-3 num">
                        <span className={(acc.realized_pnl_24h ?? acc.daily_pnl) >= 0 ? 'text-green' : 'text-red'}>
                          {fmtPnl(acc.realized_pnl_24h ?? acc.daily_pnl)}
                        </span>
                      </td>
                      <td className="px-4 py-3 num text-text">{acc.open_count}</td>
                      <td className="px-4 py-3 num text-text">{acc.daily_trades}</td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-border-soft bg-bg">
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
                  </Fragment>
                );
              })}
              {data.accounts.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <Empty title="No accounts yet" detail="Add the first one from the Accounts page." />
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

function StatusChip({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-sm border shrink-0
      ${active ? 'bg-green/10 text-green border-green/30' : 'bg-elevated text-muted border-border'}`}>
      <span className={`w-1 h-1 rounded-full ${active ? 'bg-green animate-pulse-slow' : 'bg-muted'}`} />
      {active ? 'Active' : 'Paused'}
    </span>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const color = tone === 'up' ? 'text-green' : tone === 'down' ? 'text-red' : 'text-text';
  return (
    <div>
      <p className="lbl mb-0.5">{label}</p>
      <p className={`num font-semibold text-xs ${color}`}>{value}</p>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-12 border-b border-border" />
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-r border-border last:border-r-0">
            <div className="h-2.5 w-16 bg-border" />
            <div className="h-5 w-20 bg-border mt-2.5" />
          </div>
        ))}
      </div>
      <div className="h-56 border-b border-border" />
    </div>
  );
}

function PageError({ msg }: { msg: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="lbl text-red">Connection failed</p>
      <p className="text-secondary text-sm mt-2 max-w-[60ch] mx-auto">{msg}</p>
    </div>
  );
}
