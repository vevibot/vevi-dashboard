import { OpenPosition } from '@/lib/api';
import { fmtPrice } from '@/lib/utils';
import { Badge } from './Badge';

interface Props { position: OpenPosition; }

export function PositionCard({ position: p }: Props) {
  const side   = p.side === 'buy' ? 'long' : 'short';
  const pct    = p.trail_sl && p.peak && p.entry
    ? Math.min(100, Math.max(0, Math.abs((p.peak - p.entry) / p.entry) * 100))
    : 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-slate-500 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold text-text">{p.symbol.replace('/USDT:USDT', '')}</span>
        <Badge variant={side}>{side.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted text-xs">Entry</span>
          <p className="font-mono text-text">{fmtPrice(p.entry)}</p>
        </div>
        <div>
          <span className="text-muted text-xs">Trail SL</span>
          <p className="font-mono text-red">{p.trail_sl ? fmtPrice(p.trail_sl) : '—'}</p>
        </div>
        <div>
          <span className="text-muted text-xs">Peak</span>
          <p className="font-mono text-green">{p.peak ? fmtPrice(p.peak) : '—'}</p>
        </div>
        <div>
          <span className="text-muted text-xs">Bars held</span>
          <p className="font-mono text-text">{p.bar_count}</p>
        </div>
      </div>

      {p.is_trail && (
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>Trail progress</span>
            <span className="font-mono">{pct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-green rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
