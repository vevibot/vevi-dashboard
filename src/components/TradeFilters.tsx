'use client';
/**
 * Shared trade-history filter + sort primitives.
 * Used by both the admin (all accounts) and member (own) Trades → History tabs
 * so the two stay in lockstep.
 */
import { ChevronDown } from 'lucide-react';

export type SortKey = 'pnl' | 'opened' | 'symbol';
export type SortDir = 'asc' | 'desc';
export type DirFilter = 'all' | 'buy' | 'sell';
export type DateFilter = 'all' | '24h' | '7d' | '30d';

export const DATE_MS: Record<Exclude<DateFilter, 'all'>, number> = {
  '24h': 864e5, '7d': 7 * 864e5, '30d': 30 * 864e5,
};

/** 'SUI/USDT:USDT' → 'SUI' */
export const baseOf = (sym: string) =>
  (sym || '').replace('/USDT:USDT', '').replace('/USDC:USDC', '').split('/')[0];

/** Filter bar: symbol dropdown + direction + date range. */
export function TradeFilterBar({
  symbols, sym, setSym, dir, setDir, date, setDate, count, extra,
}: {
  symbols: string[];
  sym: string; setSym: (v: string) => void;
  dir: DirFilter; setDir: (v: DirFilter) => void;
  date: DateFilter; setDate: (v: DateFilter) => void;
  count: number;
  extra?: React.ReactNode;
}) {
  const seg = (on: boolean) =>
    `px-2.5 py-1 text-[11px] font-sans font-medium transition-colors cursor-pointer ${
      on ? 'bg-green/10 text-green' : 'text-muted hover:text-text'}`;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="text-muted text-[11px] font-sans uppercase tracking-wide">Filter:</span>

      {/* Symbol */}
      <div className="relative">
        <select
          value={sym} onChange={e => setSym(e.target.value)}
          aria-label="Filter by symbol"
          className="appearance-none bg-elevated border border-border rounded-lg pl-3 pr-7 py-1.5 text-xs font-mono text-text focus:outline-none focus:border-green/50 cursor-pointer"
        >
          <option value="all">All symbols</option>
          {symbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>

      {/* Direction */}
      <div className="flex rounded-lg border border-border overflow-hidden bg-elevated">
        {(['all', 'buy', 'sell'] as DirFilter[]).map(d => (
          <button key={d} onClick={() => setDir(d)} className={seg(dir === d)}>
            {d === 'all' ? 'All' : d === 'buy' ? 'Long' : 'Short'}
          </button>
        ))}
      </div>

      {/* Date */}
      <div className="flex rounded-lg border border-border overflow-hidden bg-elevated">
        {(['24h', '7d', '30d', 'all'] as DateFilter[]).map(d => (
          <button key={d} onClick={() => setDate(d)} className={seg(date === d)}>
            {d === 'all' ? 'All' : d}
          </button>
        ))}
      </div>

      <span className="text-xs text-muted font-sans ml-auto">{count} trades</span>
      {extra}
    </div>
  );
}

/** Sortable table-header cell. */
export function SortTh({ label, col, sort, setSort, align = 'left' }: {
  label: string; col: SortKey;
  sort: { key: SortKey; dir: SortDir };
  setSort: (s: { key: SortKey; dir: SortDir }) => void;
  align?: 'left' | 'right';
}) {
  const on = sort.key === col;
  return (
    <th className={`text-muted text-xs font-medium px-5 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => setSort({ key: col, dir: on ? (sort.dir === 'asc' ? 'desc' : 'asc') : col === 'symbol' ? 'asc' : 'desc' })}
        className={`inline-flex items-center gap-1 hover:text-text transition-colors cursor-pointer ${on ? 'text-text' : ''}`}
      >
        {label}<span className="text-[9px]">{on ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
}
