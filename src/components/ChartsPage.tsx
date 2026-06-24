'use client';
import { useEffect, useMemo, useState } from 'react';
import { TradeChart, type UITrade } from './TradeChart';
import { DEMO_TRADES } from '@/lib/demoTrades';
import { getRole, getAdminTrades, getMyTrades } from '@/lib/api';
import { MANUAL_TRADE_BASES_UNIQUE, isStrategySymbol } from '@/lib/symbols';

const SYMBOLS = MANUAL_TRADE_BASES_UNIQUE.map(base => ({ label: base, bot: isStrategySymbol(base) }));
const FAKE = ['Hamza', 'Raphael', 'Omar', 'Yusuf', 'Bilal', 'Sana'];
const fmtT = (s: number) => new Date(s * 1000).toISOString().slice(5, 16).replace('T', ' ') + 'Z';
const dur = (a: number, b?: number | null) => {
  if (!b) return '—'; const m = Math.round((b - a) / 60);
  return m < 60 ? `${m}m` : `${(m / 60).toFixed(1)}h`;
};
const baseOf = (sym: string) => (sym || '').split('/')[0].replace('USDT', '');

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
  const [active, setActive] = useState(SYMBOLS.find(s => s.bot) || SYMBOLS[0]);
  const [role, setRole] = useState('');
  const [trades, setTrades] = useState<UITrade[]>([]);
  const [range, setRange] = useState<{ startMs: number; endMs: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => { setRole(getRole()); }, []);
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
      } else {
        const a = Math.min(...ui.map(t => t.openTime));
        const b = Math.max(...ui.map(t => t.closeTime || t.openTime));
        rng = { startMs: (a - 3600) * 1000, endMs: (b + 3600) * 1000 };
      }
      if (cancel) return;
      setTrades(ui); setRange(rng); setDemo(isDemo);
      setSelectedId(ui.length
        ? ui.reduce((x, y) => (y.pnlR ?? y.pnlUsd ?? 0) > (x.pnlR ?? x.pnlUsd ?? 0) ? y : x).id : null);
    })();
    return () => { cancel = true; };
  }, [active.label, role, binanceSym]);

  const sel = useMemo(() => trades.find(t => t.id === selectedId) || null, [trades, selectedId]);

  return (
    <div className="flex flex-col h-screen">
      {/* Symbol toolbar — unchanged, full width */}
      <div className="flex items-center gap-3 px-3 md:px-5 py-3 border-b border-border bg-surface shrink-0">
        <div className="flex gap-1 flex-wrap overflow-x-auto max-h-20">
          {SYMBOLS.map(s => (
            <button key={s.label} onClick={() => setActive(s)}
              title={s.bot ? `${s.label} — bot trades this` : `${s.label} — manual only`}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                active.label === s.label ? 'bg-green/15 text-green border-green/40'
                : s.bot ? 'bg-green/5 text-green/80 border-green/20 hover:border-green/40'
                : 'bg-elevated text-muted border-transparent hover:text-text'}`}>
              {s.bot && active.label !== s.label && (
                <span className="absolute top-0.5 right-1 w-1 h-1 rounded-full bg-green" />)}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart section: chart + fixed sidebar (sidebar lives inside the chart area only) */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 p-2 md:p-3">
          <TradeChart binanceSym={binanceSym} interval={range ? '5m' : '15m'} range={range}
            trades={trades} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <aside className="w-[300px] shrink-0 border-l border-border bg-surface flex flex-col">
          <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
            <span className="text-[11px] tracking-widest text-muted uppercase font-mono">
              {role === 'admin' ? 'All trades' : 'Your trades'} · {trades.length}
            </span>
            {demo && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-green/10 text-green/70 border border-green/20">SAMPLE</span>}
          </div>

          <div className="overflow-auto" style={{ maxHeight: '42%' }}>
            {trades.length === 0 && <div className="p-4 text-xs text-muted">No trades on {active.label}.</div>}
            {trades.map(t => {
              const buy = t.side === 'buy', pos = (t.pnlR ?? t.pnlUsd ?? 0) >= 0;
              return (
                <button key={t.id} onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-3 py-2 border-b border-border/60 flex items-center gap-2 transition-colors ${
                    selectedId === t.id ? 'bg-green/10 shadow-[inset_3px_0_0_#00FF41]' : 'hover:bg-green/[0.04]'}`}>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[46px] text-center ${
                    buy ? 'bg-green/15 text-green' : 'bg-red/15 text-red'}`}>{buy ? 'LONG' : 'SHORT'}</span>
                  <span className="flex-1 min-w-0 text-xs font-mono">
                    <b>{t.size ?? '—'}</b> <span className="text-muted">@ {t.entry}</span><br />
                    <span className="text-[10px]">
                      {role === 'admin' && t.account ? <span className="text-green/70">▸ {t.account}</span>
                        : <span className="text-muted">held {dur(t.openTime, t.closeTime)}</span>}
                    </span>
                  </span>
                  <span className={`text-xs font-bold font-mono tabular-nums ${pos ? 'text-green' : 'text-red'}`}>
                    {t.pnlR != null ? `${pos ? '+' : ''}${t.pnlR}R` : t.pnlUsd != null ? `${pos ? '+' : ''}$${t.pnlUsd}` : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {sel && (
            <div className="border-t border-border p-3 overflow-auto flex-1">
              <div className={`text-2xl font-bold font-mono tabular-nums ${(sel.pnlR ?? sel.pnlUsd ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                {sel.pnlR != null ? `${sel.pnlR >= 0 ? '+' : ''}${sel.pnlR}R` : `${(sel.pnlUsd ?? 0) >= 0 ? '+' : ''}$${sel.pnlUsd}`}
              </div>
              <div className="text-[11px] text-muted mb-3 font-mono">
                {sel.pnlUsd != null && `${sel.pnlUsd >= 0 ? '+' : ''}$${sel.pnlUsd} · `}
                {sel.side === 'buy' ? 'LONG' : 'SHORT'}{sel.leverage ? ` · ${sel.leverage}×` : ''}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs font-mono">
                {([
                  ['Size', sel.size ?? '—'], ['Notional', sel.notional != null ? `$${sel.notional}` : '—'],
                  ['Entry', sel.entry], ['Exit', sel.exit ?? '—'],
                  ['Stop-loss', sel.sl ?? '—'], ['Take-profit', sel.tp ?? '—'],
                  ['Opened', fmtT(sel.openTime)], ['Closed', sel.closeTime ? fmtT(sel.closeTime) : 'open'],
                  ['Duration', dur(sel.openTime, sel.closeTime)], ['Exit', sel.reason || '—'],
                  ['Confidence', sel.conf != null ? `${sel.conf} / 10` : '—'], ['Account', sel.account ?? 'You'],
                ] as [string, any][]).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-wide text-muted">{k}</span>
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
