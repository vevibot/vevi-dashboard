'use client';
import { TickerData, KlineCandle } from '@/lib/marketData';
import { Sparkline } from './Sparkline';
import { OpenPosition } from '@/lib/api';
import { fmtPrice } from '@/lib/utils';

interface SymbolActivity {
  status: string;
  bias: number;
  detail: string;
  updated_at: string;
}

interface Props {
  symbol: string;                  // 'LINK'
  ticker: TickerData | null;
  klines: KlineCandle[];
  activity: SymbolActivity | undefined;
  openPosition?: OpenPosition;
}

const STATUS_STYLES: Record<string, { label: string; dot: string; chip: string }> = {
  open_long:  { label: 'LONG',     dot: 'bg-green',    chip: 'bg-green/10 text-green border-green/30' },
  open_short: { label: 'SHORT',    dot: 'bg-red',      chip: 'bg-red/10 text-red border-red/30' },
  placing:    { label: 'PLACING',  dot: 'bg-warn',     chip: 'bg-warn/10 text-warn border-warn/30' },
  scanning:   { label: 'SCANNING', dot: 'bg-secondary', chip: 'bg-elevated text-secondary border-border' },
  filtered:   { label: 'FILTERED', dot: 'bg-muted',    chip: 'bg-elevated text-muted border-border' },
  blocked:    { label: 'BLOCKED',  dot: 'bg-border',   chip: 'bg-elevated text-muted border-border' },
  neutral:    { label: 'NEUTRAL',  dot: 'bg-muted',    chip: 'bg-elevated text-muted border-border' },
};

function fmtVol(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(0);
}

function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso + 'Z').getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function SymbolPanel({ symbol, ticker, klines, activity, openPosition }: Props) {
  const status   = activity?.status || 'scanning';
  const cfg      = STATUS_STYLES[status] || STATUS_STYLES.scanning;
  const isOpen   = status === 'open_long' || status === 'open_short';
  const isPos    = !!openPosition;
  const change   = ticker?.change24h ?? 0;
  const isUp     = change >= 0;
  const closes   = klines.map(k => k.close);

  return (
    <div
      className={`relative bg-surface border rounded-xl p-5 transition-all duration-200 flex flex-col gap-4
        ${isOpen || isPos
          ? 'border-green/40 shadow-md'
          : 'border-border hover:border-text/20'}`}
    >
      {/* Header: symbol + status chip */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${cfg.dot} ${isOpen ? 'animate-pulse' : ''}`} />
          <div>
            <div className="font-mono text-text font-semibold text-base leading-none">{symbol}</div>
            <div className="font-mono text-[11px] text-muted mt-1">USDT.P</div>
          </div>
        </div>
        <span className={`font-mono text-[11px] font-bold tracking-wide px-2 py-1 rounded border ${cfg.chip}`}>
          {cfg.label}
        </span>
      </div>

      {/* Price + 24h change */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold text-text leading-none tabular-nums">
            {ticker ? `$${fmtPrice(ticker.price)}` : '···'}
          </span>
          {ticker && (
            <span className={`font-mono text-xs font-medium tabular-nums ${isUp ? 'text-green' : 'text-red'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </span>
          )}
        </div>
        {ticker && (
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted font-mono tabular-nums">
            <span>H ${fmtPrice(ticker.high24h)}</span>
            <span>L ${fmtPrice(ticker.low24h)}</span>
            <span>Vol {fmtVol(ticker.volume24h)}</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div className="h-8 -mx-1">
        {closes.length > 0 && (
          <Sparkline data={closes} color="auto" width={250} height={32} />
        )}
      </div>

      {/* Bot signal block */}
      <div className="pt-3 border-t border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted text-[11px] font-sans uppercase tracking-wide">Bias</span>
          <span className={`font-mono text-xs font-semibold tabular-nums ${
            (activity?.bias ?? 0) > 0 ? 'text-green' :
            (activity?.bias ?? 0) < 0 ? 'text-red'   : 'text-muted'
          }`}>
            {activity ? (activity.bias > 0 ? '+' : '') + activity.bias.toFixed(2) : '—'}
            {activity && activity.bias !== 0 && (
              <span className="text-muted ml-1 font-normal text-[11px]">
                {activity.bias > 0 ? 'LONG' : 'SHORT'}
              </span>
            )}
          </span>
        </div>

        {activity?.detail && (
          <div className="text-xs text-secondary font-sans leading-snug" title={activity.detail}>
            {activity.detail}
          </div>
        )}

        <div className="text-[11px] text-muted font-mono tabular-nums">
          {timeAgo(activity?.updated_at)}
        </div>
      </div>

      {/* Open position extras */}
      {isPos && openPosition && (
        <div className="pt-3 border-t border-green/20 grid grid-cols-3 gap-2 -mb-1">
          <div>
            <p className="text-[11px] text-muted uppercase tracking-wide font-sans">Entry</p>
            <p className="font-mono text-xs text-text mt-0.5 tabular-nums">${fmtPrice(openPosition.entry)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted uppercase tracking-wide font-sans">Trail SL</p>
            <p className="font-mono text-xs text-text mt-0.5 tabular-nums">
              {openPosition.trail_sl ? `$${fmtPrice(openPosition.trail_sl)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted uppercase tracking-wide font-sans">Bars</p>
            <p className="font-mono text-xs text-text mt-0.5 tabular-nums">{openPosition.bar_count ?? 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
