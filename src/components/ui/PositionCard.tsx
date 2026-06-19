'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, X, ArrowUpRight } from 'lucide-react';
import { OpenPosition, closePosition } from '@/lib/api';
import { fmtPrice } from '@/lib/utils';
import { Badge } from './Badge';

interface Props {
  position: OpenPosition;
  accountId?: string;
  onTrade?: (symbol: string) => void;
  onClosed?: () => void;
}

export function PositionCard({ position: p, accountId, onTrade, onClosed }: Props) {
  const router = useRouter();
  const side = p.side === 'buy' ? 'long' : 'short';
  const pct  = p.trail_sl && p.peak && p.entry
    ? Math.min(100, Math.max(0, Math.abs((p.peak - p.entry) / p.entry) * 100))
    : 0;

  const [closing, setClosing]   = useState(false);
  const [closeErr, setCloseErr] = useState('');
  const [confirm, setConfirm]   = useState(false);

  async function handleClose() {
    if (!accountId) return;
    if (!confirm) { setConfirm(true); return; }
    setClosing(true);
    setCloseErr('');
    setConfirm(false);
    try {
      await closePosition({ account_id: accountId, symbol: p.symbol });
      onClosed?.();
    } catch (err: any) {
      const msg = err.message || 'Close failed';
      setCloseErr(msg.includes('No open position') ? 'Already closed on exchange' : msg);
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-slate-500 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/admin/trades')}
          className="flex items-center gap-1 font-mono font-semibold text-text hover:text-green transition-colors cursor-pointer group"
          title="View in Trades"
        >
          {p.symbol.replace('/USDT:USDT', '').replace('/USDC:USDC', '')}
          <ArrowUpRight size={12} className="text-muted group-hover:text-green transition-colors" />
        </button>
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

      {closeErr && (
        <p className="text-red text-xs bg-red/5 border border-red/20 rounded-lg px-2 py-1.5">{closeErr}</p>
      )}

      <div className="flex gap-2">
        {onTrade && (
          <button
            onClick={() => { setConfirm(false); onTrade(p.symbol); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-sans text-muted hover:text-text hover:bg-elevated border border-border hover:border-slate-500 transition-colors cursor-pointer"
          >
            <BarChart2 size={13} />
            Chart / Trade
          </button>
        )}
        {accountId && (
          <button
            onClick={handleClose}
            disabled={closing}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-sans border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
              ${confirm
                ? 'flex-1 bg-red text-white border-red hover:bg-red/90 font-semibold'
                : 'px-3 text-red/80 border-red/30 bg-red/5 hover:bg-red/10 hover:text-red hover:border-red/50'
              }`}
          >
            <X size={13} />
            {closing ? 'Closing…' : confirm ? 'Confirm Close' : 'Close'}
          </button>
        )}
      </div>
    </div>
  );
}
