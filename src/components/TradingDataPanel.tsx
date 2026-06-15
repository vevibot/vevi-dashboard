'use client';
import { useState, useCallback } from 'react';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  getOpenOrders, getOrderHistory, getPositionHistory, getTransactions,
  getTrades, closeAll, closePosition,
  OpenPosition, ExOrder, ExTrade, ExTx, Trade,
} from '@/lib/api';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { STRATEGY_BASES } from '@/lib/symbols';

const TABS = ['Positions', 'Open Orders', 'Order History', 'Trade History', 'Position History', 'Transaction History'] as const;
type Tab = typeof TABS[number];
// Filter row: strategy symbols + 'ALL' (covers what the bot trades).
// Manual-only symbols (BTC/ETH/etc) won't have prior history filtered here.
const SYMBOLS = ['ALL', ...STRATEGY_BASES];

function toFullSym(base: string, exchange: string) {
  return exchange === 'hyperliquid' ? `${base}/USDC:USDC` : `${base}/USDT:USDT`;
}

function fmtTs(ts: number | string | null) {
  if (!ts) return '—';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

function symBase(sym: string) { return sym.split('/')[0]; }

interface Props {
  accountId: string;
  exchange: string;
  openPositions: OpenPosition[];
  canTrade?: boolean;
  onRefresh?: () => void;
}

export function TradingDataPanel({ accountId, exchange, openPositions, canTrade, onRefresh }: Props) {
  const [tab, setTab]         = useState<Tab>('Positions');
  const [sym, setSym]         = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [cache, setCache]     = useState<Partial<Record<Tab, any[]>>>({});
  const [confirmClose, setConfirmClose] = useState(false);
  const [closingAll, setClosingAll]     = useState(false);
  const [closingPos, setClosingPos]     = useState<string | null>(null);

  const symParam = sym === 'ALL' ? undefined : toFullSym(sym, exchange);

  const loadTab = useCallback(async (t: Tab, invalidate = false) => {
    if (t === 'Positions') return;
    if (cache[t] && !invalidate) return;
    setLoading(true);
    try {
      let result: any[] = [];
      if (t === 'Open Orders')        result = (await getOpenOrders(accountId, symParam)).orders;
      else if (t === 'Order History') result = (await getOrderHistory(accountId, symParam)).orders;
      else if (t === 'Trade History') result = (await getTrades(accountId, 100)).trades.filter((x: Trade) => !x.is_open);
      else if (t === 'Position History') result = (await getPositionHistory(accountId, symParam)).trades;
      else if (t === 'Transaction History') result = (await getTransactions(accountId)).transactions;
      setCache(prev => ({ ...prev, [t]: result }));
    } catch {
      setCache(prev => ({ ...prev, [t]: [] }));
    } finally {
      setLoading(false);
    }
  }, [accountId, symParam, cache]);

  const switchTab = (t: Tab) => {
    setTab(t);
    loadTab(t);
  };

  const changeSymbol = (s: string) => {
    setSym(s);
    setCache({});
    setTimeout(() => loadTab(tab, true), 0);
  };

  const handleCloseAll = async () => {
    setClosingAll(true);
    try {
      await closeAll(accountId);
      onRefresh?.();
    } catch { /* error shown elsewhere */ }
    finally {
      setClosingAll(false);
      setConfirmClose(false);
    }
  };

  const handleCloseOne = async (symbol: string) => {
    setClosingPos(symbol);
    try {
      await closePosition({ account_id: accountId, symbol });
      onRefresh?.();
    } catch { /* ignore */ }
    finally { setClosingPos(null); }
  };

  const rows = tab === 'Positions' ? openPositions : (cache[tab] ?? null);
  const filtered = tab === 'Positions' && sym !== 'ALL'
    ? openPositions.filter(p => symBase(p.symbol) === sym)
    : rows;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header row: tabs + symbol filter + controls */}
      <div className="border-b border-border">
        {/* Tab row */}
        <div className="flex items-center gap-0 px-4 pt-3 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`px-3.5 py-2 text-xs font-sans whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                tab === t
                  ? 'border-green text-text font-medium'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              {t}
              {t === 'Positions' && (
                <span className={`ml-1.5 font-mono text-[10px] px-1 py-0.5 rounded ${
                  openPositions.length > 0 ? 'bg-green/15 text-green' : 'bg-elevated text-muted'
                }`}>
                  {openPositions.length}
                </span>
              )}
              {t === 'Open Orders' && cache[t] != null && (
                <span className={`ml-1.5 font-mono text-[10px] px-1 py-0.5 rounded ${
                  (cache[t]?.length ?? 0) > 0 ? 'bg-yellow-400/15 text-yellow-400' : 'bg-elevated text-muted'
                }`}>
                  {cache[t]?.length ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Symbol filter row */}
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex gap-1 flex-wrap flex-1">
            {SYMBOLS.map(s => (
              <button
                key={s}
                onClick={() => changeSymbol(s)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  sym === s
                    ? 'bg-green/15 text-green border border-green/30'
                    : 'bg-elevated text-muted hover:text-text border border-transparent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={() => loadTab(tab, true)}
              disabled={loading}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-elevated transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            {canTrade && openPositions.length > 0 && (
              <button
                onClick={() => setConfirmClose(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium bg-red/10 text-red border border-red/30 hover:bg-red/20 transition-colors cursor-pointer"
              >
                Close All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ minHeight: 140 }}>
        {loading && tab !== 'Positions' && rows == null ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-4 h-4 border-2 border-green/30 border-t-green rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'Positions' && <PositionsTable rows={filtered as OpenPosition[]} canTrade={canTrade} onClose={handleCloseOne} closingPos={closingPos} />}
            {tab === 'Open Orders' && <OrdersTable rows={(filtered as ExOrder[]) ?? []} loaded={cache[tab] != null} />}
            {tab === 'Order History' && <OrdersTable rows={(filtered as ExOrder[]) ?? []} loaded={cache[tab] != null} />}
            {tab === 'Trade History' && <TradeHistoryTable rows={(filtered as Trade[]) ?? []} loaded={cache[tab] != null} />}
            {tab === 'Position History' && <ExTradeTable rows={(filtered as ExTrade[]) ?? []} loaded={cache[tab] != null} />}
            {tab === 'Transaction History' && <TxTable rows={(filtered as ExTx[]) ?? []} loaded={cache[tab] != null} />}
          </>
        )}
      </div>

      {/* Confirm close all */}
      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl p-6 w-80 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red shrink-0" />
              <h3 className="font-sans font-semibold text-text">Close All Positions?</h3>
            </div>
            <p className="text-muted text-sm font-sans mb-6">
              This will market-close every open position on this account immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClose(false)}
                className="flex-1 py-2 rounded-lg text-sm font-sans border border-border text-muted hover:text-text hover:bg-elevated transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseAll}
                disabled={closingAll}
                className="flex-1 py-2 rounded-lg text-sm font-sans font-medium bg-red/15 text-red border border-red/30 hover:bg-red/25 transition-colors cursor-pointer disabled:opacity-50"
              >
                {closingAll ? 'Closing…' : 'Close All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Positions table ────────────────────────────────────────────────────────────

function PositionsTable({ rows, canTrade, onClose, closingPos }: {
  rows: OpenPosition[]; canTrade?: boolean;
  onClose: (sym: string) => void; closingPos: string | null;
}) {
  if (!rows.length) return <Empty text="No open positions" />;
  return (
    <table className="w-full text-xs font-sans">
      <thead>
        <tr className="border-b border-border/60">
          {['Symbol', 'Side', 'Entry', 'Trail SL', 'Peak', 'Bars', canTrade ? 'Action' : ''].filter(Boolean).map(h => (
            <th key={h} className="text-left text-muted font-medium px-4 py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(p => (
          <tr key={p.symbol} className="border-b border-border/30 hover:bg-elevated/40">
            <td className="px-4 py-2 font-mono text-text font-medium">{symBase(p.symbol)}</td>
            <td className="px-4 py-2">
              <span className={`font-mono font-semibold ${p.side === 'long' ? 'text-green' : 'text-red'}`}>
                {p.side?.toUpperCase()}
              </span>
            </td>
            <td className="px-4 py-2 font-mono text-text">{fmtPrice(p.entry)}</td>
            <td className="px-4 py-2 font-mono text-muted">{p.trail_sl ? fmtPrice(p.trail_sl) : '—'}</td>
            <td className="px-4 py-2 font-mono text-muted">{p.peak ? fmtPrice(p.peak) : '—'}</td>
            <td className="px-4 py-2 font-mono text-muted">{p.bar_count}</td>
            {canTrade && (
              <td className="px-4 py-2">
                <button
                  onClick={() => onClose(p.symbol)}
                  disabled={closingPos === p.symbol}
                  className="px-2.5 py-1 rounded text-[11px] font-medium bg-red/10 text-red border border-red/20 hover:bg-red/20 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {closingPos === p.symbol ? '…' : 'Close'}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


// ── Open / Order History table ─────────────────────────────────────────────────

function OrdersTable({ rows, loaded }: { rows: ExOrder[]; loaded: boolean }) {
  if (!loaded) return <Empty text="Select this tab to load" />;
  if (!rows.length) return <Empty text="No orders" />;
  return (
    <table className="w-full text-xs font-sans">
      <thead>
        <tr className="border-b border-border/60">
          {['Time', 'Symbol', 'Type', 'Side', 'Amount', 'Price', 'Status'].map(h => (
            <th key={h} className="text-left text-muted font-medium px-4 py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((o, i) => (
          <tr key={o.id ?? i} className="border-b border-border/30 hover:bg-elevated/40">
            <td className="px-4 py-2 text-muted font-mono">{fmtTs(o.timestamp)}</td>
            <td className="px-4 py-2 font-mono text-text">{symBase(o.symbol)}</td>
            <td className="px-4 py-2 text-muted capitalize">{o.type}</td>
            <td className="px-4 py-2">
              <span className={`font-mono font-semibold ${o.side === 'buy' ? 'text-green' : 'text-red'}`}>
                {o.side?.toUpperCase()}
              </span>
            </td>
            <td className="px-4 py-2 font-mono text-text">{o.amount?.toFixed(4)}</td>
            <td className="px-4 py-2 font-mono text-text">{o.price ? fmtPrice(o.price) : 'Market'}</td>
            <td className="px-4 py-2 text-muted capitalize">{o.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


// ── Trade History (from DB) ────────────────────────────────────────────────────

function TradeHistoryTable({ rows, loaded }: { rows: Trade[]; loaded: boolean }) {
  if (!loaded) return <Empty text="Select this tab to load" />;
  if (!rows.length) return <Empty text="No closed trades" />;
  return (
    <table className="w-full text-xs font-sans">
      <thead>
        <tr className="border-b border-border/60">
          {['Date', 'Symbol', 'Side', 'Entry', 'Exit', 'P&L'].map(h => (
            <th key={h} className="text-left text-muted font-medium px-4 py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((t, i) => (
          <tr key={t.id ?? i} className="border-b border-border/30 hover:bg-elevated/40">
            <td className="px-4 py-2 text-muted font-mono">{fmtDate(t.closed_at ?? t.opened_at)}</td>
            <td className="px-4 py-2 font-mono text-text">{symBase(t.symbol)}</td>
            <td className="px-4 py-2">
              <span className={`font-mono font-semibold ${t.side === 'long' ? 'text-green' : 'text-red'}`}>
                {t.side?.toUpperCase()}
              </span>
            </td>
            <td className="px-4 py-2 font-mono text-text">{fmtPrice(t.entry)}</td>
            <td className="px-4 py-2 font-mono text-muted">{t.exit_price ? fmtPrice(t.exit_price) : '—'}</td>
            <td className={`px-4 py-2 font-mono font-semibold ${(t.pnl ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
              {t.pnl != null ? fmtPnl(t.pnl) : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


// ── Position History (exchange fills) ─────────────────────────────────────────

function ExTradeTable({ rows, loaded }: { rows: ExTrade[]; loaded: boolean }) {
  if (!loaded) return <Empty text="Select this tab to load" />;
  if (!rows.length) return <Empty text="No trade history" />;
  return (
    <table className="w-full text-xs font-sans">
      <thead>
        <tr className="border-b border-border/60">
          {['Time', 'Symbol', 'Side', 'Price', 'Amount', 'Value', 'Fee'].map(h => (
            <th key={h} className="text-left text-muted font-medium px-4 py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((t, i) => (
          <tr key={t.id ?? i} className="border-b border-border/30 hover:bg-elevated/40">
            <td className="px-4 py-2 text-muted font-mono">{fmtTs(t.timestamp)}</td>
            <td className="px-4 py-2 font-mono text-text">{symBase(t.symbol)}</td>
            <td className="px-4 py-2">
              <span className={`font-mono font-semibold ${t.side === 'buy' ? 'text-green' : 'text-red'}`}>
                {t.side?.toUpperCase()}
              </span>
            </td>
            <td className="px-4 py-2 font-mono text-text">{fmtPrice(t.price)}</td>
            <td className="px-4 py-2 font-mono text-text">{t.amount?.toFixed(4)}</td>
            <td className="px-4 py-2 font-mono text-muted">${t.cost?.toFixed(2)}</td>
            <td className="px-4 py-2 font-mono text-muted">
              {t.fee ? `$${t.fee.cost.toFixed(4)}` : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


// ── Transaction History ────────────────────────────────────────────────────────

function TxTable({ rows, loaded }: { rows: ExTx[]; loaded: boolean }) {
  if (!loaded) return <Empty text="Select this tab to load" />;
  if (!rows.length) return <Empty text="No transactions" />;
  return (
    <table className="w-full text-xs font-sans">
      <thead>
        <tr className="border-b border-border/60">
          {['Time', 'Type', 'Amount', 'Currency'].map(h => (
            <th key={h} className="text-left text-muted font-medium px-4 py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((t, i) => (
          <tr key={t.id ?? i} className="border-b border-border/30 hover:bg-elevated/40">
            <td className="px-4 py-2 text-muted font-mono">{fmtTs(t.timestamp)}</td>
            <td className="px-4 py-2 text-text capitalize">{t.type}</td>
            <td className={`px-4 py-2 font-mono font-semibold ${t.amount >= 0 ? 'text-green' : 'text-red'}`}>
              {t.amount >= 0 ? '+' : ''}{t.amount?.toFixed(6)}
            </td>
            <td className="px-4 py-2 font-mono text-muted">{t.currency}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-24 text-muted text-xs font-sans">{text}</div>
  );
}
