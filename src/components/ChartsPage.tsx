'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { TradeChart, type UITrade } from './TradeChart';
import { DEMO_TRADES } from '@/lib/demoTrades';
import { getRole, getAdminTrades, getMyTrades } from '@/lib/api';
import { MANUAL_TRADE_BASES_UNIQUE, isStrategySymbol } from '@/lib/symbols';
import { fmtPrice, fmtPnl } from '@/lib/utils';

const SYMBOLS = MANUAL_TRADE_BASES_UNIQUE.map(base => ({ label: base, bot: isStrategySymbol(base) }));
// Strategy symbols get pinned as quick-access chips; everything else via search.
const QUICK = SYMBOLS.filter(s => s.bot);
const FAKE = ['Hamza', 'Raphael', 'Omar', 'Yusuf', 'Bilal', 'Sana'];
const fmtT = (s: number) => new Date(s * 1000).toISOString().slice(5, 16).replace('T', ' ') + 'Z';
const dur = (a: number, b?: number | null) => {
  if (!b) return '—'; const m = Math.round((b - a) / 60);
  return m < 60 ? `${m}m` : `${(m / 60).toFixed(1)}h`;
};
const baseOf = (sym: string) => (sym || '').split('/')[0].replace('USDT', '');

interface Sym { label: string; bot: boolean; }

function mapApiTrade(t: any): UITrade {
  const open = Math.floor(new Date(t.opened_at).getTime() / 1000);
  return {
    id: String(t.id ?? `${t.symbol}-${t.opened_at}`), side: t.side,
    entry: t.entry, exit: t.exit_price ?? null, sl: t.sl ?? null, tp: t.tp ?? null,
    size: t.size ?? null, notional: t.notional ?? null, leverage: t.leverage ?? null,
    openTime: open, closeTime: t.closed_at ? Math.floor(new Date(t.closed_at).getTime() / 1000) : null,
    pnlUsd: t.pnl ?? null, pnlR: t.pnl_r ?? null, reason: t.reason ?? '', conf: t.confidence,
    account: t.account_name ?? t.name,
  };
}

export function ChartsPage() {
  const [active, setActive] = useState<Sym>(SYMBOLS.find(s => s.bot) || SYMBOLS[0]);
  const [role, setRole] = useState('');
  const [trades, setTrades] = useState<UITrade[]>([]);
  const [range, setRange] = useState<{ startMs: number; endMs: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  // Symbol search combobox
  const [query, setQuery] = useState('');
  const [showList, setShowList] = useState(false);
  // Deep-link: a trade id from ?trade= to auto-select once trades load
  const pendingTradeRef = useRef<string | null>(null);

  useEffect(() => {
    setRole(getRole());
    // Deep-link support: /charts?symbol=X&trade=<id> (read straight off the URL
    // to avoid useSearchParams' Suspense requirement under static export).
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const sym = p.get('symbol');
      const tr = p.get('trade');
      if (sym) setActive({ label: sym.toUpperCase(), bot: isStrategySymbol(sym) });
      if (tr) pendingTradeRef.current = tr;
    }
  }, []);
  const binanceSym = active.label + 'USDT';

  useEffect(() => {
    let cancel = false;
    (async () => {
      let ui: UITrade[] = [];
      try {
        const resp: any = role === 'admin' ? await getAdminTrades(300) : await getMyTrades(300);
        ui = (resp?.trades || []).filter((t: any) => baseOf(t.symbol) === active.label).map(mapApiTrade);
      } catch { /* API down (bot paused) → demo */ }

      let rng: { startMs: number; endMs: number } | null = null;
      let isDemo = false;
      // Sample trades are a LOCAL-PREVIEW aid only — never show fabricated P&L
      // on the live dashboard. In production, show real trades (or empty).
      if (ui.length === 0 && process.env.NODE_ENV !== 'production') {
        const d = DEMO_TRADES[binanceSym];
        if (d) {
          isDemo = true; rng = { startMs: d.startMs, endMs: d.endMs };
          ui = d.trades.map((t, i) => ({ ...t, account: role === 'admin' ? FAKE[i % FAKE.length] : undefined }));
        }
      } else if (ui.length > 0) {
        const a = Math.min(...ui.map(t => t.openTime));
        const b = Math.max(...ui.map(t => t.closeTime || t.openTime));
        rng = { startMs: (a - 3600) * 1000, endMs: (b + 3600) * 1000 };
      }
      if (cancel) return;
      setTrades(ui); setRange(rng); setDemo(isDemo);
      // Honour a deep-linked trade id if it's present in this symbol's set,
      // otherwise select the best trade.
      const pending = pendingTradeRef.current;
      const deepLinked = pending && ui.some(t => t.id === pending) ? pending : null;
      setSelectedId(deepLinked ?? (ui.length
        ? ui.reduce((x, y) => (y.pnlR ?? y.pnlUsd ?? 0) > (x.pnlR ?? x.pnlUsd ?? 0) ? y : x).id : null));
      if (deepLinked) pendingTradeRef.current = null;
    })();
    return () => { cancel = true; };
  }, [active.label, role, binanceSym]);

  const sel = useMemo(() => trades.find(t => t.id === selectedId) || null, [trades, selectedId]);

  // Combobox
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return SYMBOLS;
    return SYMBOLS.filter(s => s.label.includes(q));
  }, [query]);

  function pick(base: string) {
    const label = base.trim().toUpperCase();
    if (!label) return;
    setActive({ label, bot: isStrategySymbol(label) });
    setQuery(''); setShowList(false);
  }

  const chipCls = (isActive: boolean, bot: boolean) =>
    `relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap border ${
      isActive ? 'bg-green/15 text-green border-green/40'
      : bot ? 'bg-green/5 text-green/80 border-green/20 hover:border-green/40'
      : 'bg-elevated text-muted border-transparent hover:text-text'}`;

  const activeIsQuick = QUICK.some(s => s.label === active.label);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-screen">
      {/* Symbol toolbar: search combobox + strategy quick-chips */}
      <div className="flex items-center gap-2 px-3 md:px-5 py-3 border-b border-border bg-surface shrink-0 flex-wrap">
        {/* Search combobox — any BingX base by name or free-text Enter */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowList(true); }}
            onFocus={() => setShowList(true)}
            onBlur={() => setTimeout(() => setShowList(false), 150)}
            onKeyDown={e => {
              if (e.key === 'Enter') { pick(query); }
              else if (e.key === 'Escape') { setShowList(false); (e.target as HTMLInputElement).blur(); }
            }}
            placeholder="Search symbol… (e.g. BTC, PEPE)"
            aria-label="Search chart symbol"
            className="w-44 md:w-56 bg-elevated border border-border rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono text-text placeholder:text-muted focus:outline-none focus:border-green/50"
          />
          {showList && filtered.length > 0 && (
            <div className="absolute z-30 mt-1 w-56 max-h-64 overflow-auto bg-surface border border-border rounded-lg shadow-lg">
              {filtered.slice(0, 40).map(s => (
                <button
                  key={s.label}
                  // onMouseDown fires before the input's blur, so the pick sticks
                  onMouseDown={e => { e.preventDefault(); pick(s.label); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono text-left transition-colors ${
                    active.label === s.label ? 'bg-green/10 text-green' : 'text-secondary hover:bg-elevated hover:text-text'}`}
                >
                  <span>{s.label}</span>
                  {s.bot && <span className="text-[9px] text-green/70 tracking-wider">BOT</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border hidden md:block" />

        {/* Strategy quick-chips */}
        <div className="flex gap-1 flex-wrap">
          {QUICK.map(s => (
            <button key={s.label} onClick={() => setActive(s)}
              title={`${s.label} — bot trades this`}
              className={chipCls(active.label === s.label, true)}>
              {active.label !== s.label && (
                <span className="absolute top-0.5 right-1 w-1 h-1 rounded-full bg-green" />)}
              {s.label}
            </button>
          ))}
          {/* Show the active symbol as a chip when it's a searched (non-strategy) one */}
          {!activeIsQuick && (
            <button className={chipCls(true, active.bot)} title={`${active.label} — manual`}>
              {active.label}
            </button>
          )}
        </div>
      </div>

      {/* Chart section: chart + trade sidebar. Stacks on mobile, splits on md+. */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <div className="flex-1 min-w-0 p-2 md:p-3 min-h-[60vh] md:min-h-0">
          <TradeChart binanceSym={binanceSym} interval={range ? '5m' : '15m'} range={range}
            trades={trades} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <aside className="w-full md:w-[300px] shrink-0 border-t md:border-t-0 md:border-l border-border bg-surface flex flex-col">
          <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
            <span className="text-[11px] tracking-widest text-muted uppercase font-mono">
              {role === 'admin' ? 'All trades' : 'Your trades'} · {trades.length}
            </span>
            {demo && <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-elevated text-muted border border-border">SAMPLE</span>}
          </div>

          <div className="overflow-auto max-h-[35vh] md:max-h-[42%]">
            {trades.length === 0 && <div className="p-4 text-xs text-muted">No trades on {active.label}.</div>}
            {trades.map(t => {
              const buy = t.side === 'buy', pos = (t.pnlR ?? t.pnlUsd ?? 0) >= 0;
              return (
                <button key={t.id} onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-3 py-2 border-b border-border/60 flex items-center gap-2 transition-colors ${
                    selectedId === t.id ? 'bg-accent/10 shadow-[inset_3px_0_0_#4DA3FF]' : 'hover:bg-accent/[0.06]'}`}>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded min-w-[46px] text-center ${
                    buy ? 'bg-green/15 text-green' : 'bg-red/15 text-red'}`}>{buy ? 'LONG' : 'SHORT'}</span>
                  <span className="flex-1 min-w-0 text-xs font-mono">
                    <b className="tabular-nums">{t.size ?? '—'}</b> <span className="text-muted tabular-nums">@ {fmtPrice(t.entry)}</span><br />
                    <span className="text-[11px]">
                      {role === 'admin' && t.account ? <span className="text-accent">▸ {t.account}</span>
                        : <span className="text-muted">held {dur(t.openTime, t.closeTime)}</span>}
                    </span>
                  </span>
                  <span className={`text-xs font-bold font-mono tabular-nums ${pos ? 'text-green' : 'text-red'}`}>
                    {t.pnlR != null ? `${pos ? '+' : ''}${t.pnlR}R` : t.pnlUsd != null ? fmtPnl(t.pnlUsd) : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {sel && (
            <div className="border-t border-border p-3 overflow-auto flex-1">
              <div className={`text-2xl font-bold font-mono tabular-nums ${(sel.pnlR ?? sel.pnlUsd ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                {sel.pnlR != null ? `${sel.pnlR >= 0 ? '+' : ''}${sel.pnlR}R` : fmtPnl(sel.pnlUsd)}
              </div>
              <div className="text-[11px] text-muted mb-3 font-mono tabular-nums">
                {sel.pnlUsd != null && `${fmtPnl(sel.pnlUsd)} · `}
                {sel.side === 'buy' ? 'LONG' : 'SHORT'}{sel.leverage ? ` · ${sel.leverage}×` : ''}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs font-mono">
                {([
                  ['Size', sel.size ?? '—'], ['Notional', sel.notional != null ? `$${sel.notional}` : '—'],
                  ['Entry', fmtPrice(sel.entry)], ['Exit', sel.exit != null ? fmtPrice(sel.exit) : '—'],
                  ['Stop-loss', sel.sl != null ? fmtPrice(sel.sl) : '—'], ['Take-profit', sel.tp != null ? fmtPrice(sel.tp) : '—'],
                  ['Opened', fmtT(sel.openTime)], ['Closed', sel.closeTime ? fmtT(sel.closeTime) : 'open'],
                  ['Duration', dur(sel.openTime, sel.closeTime)], ['Exit', sel.reason || '—'],
                  ['Confidence', sel.conf != null ? `${sel.conf} / 10` : '—'], ['Account', sel.account ?? 'You'],
                ] as [string, any][]).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase tracking-wide text-muted">{k}</span>
                    <span className={`tabular-nums ${k === 'Stop-loss' ? 'text-red' : k === 'Take-profit' ? 'text-green' : 'text-text'}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
