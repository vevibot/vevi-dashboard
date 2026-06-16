'use client';
import { useEffect, useState } from 'react';
import {
  getExchangePnl, getMyExchangePnl,
  ExchangePnlSummary, ExchangePnlBySymbol,
} from '@/lib/api';
import { fmtPnl } from '@/lib/utils';
import { Shield, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  /** Admin: pass the account_id. Member: omit (uses own). */
  accountId?: string;
  /** Window in days (default 7, max 90). */
  days?: number;
  /** When `accountId` is null/undefined for admin, render skeleton. */
  defer?: boolean;
}

const WINDOWS = [
  { label: '24h',  days: 1  },
  { label: '7d',   days: 7  },
  { label: '30d',  days: 30 },
  { label: '90d',  days: 90 },
];

export function ExchangePnlPanel({ accountId, days = 7, defer }: Props) {
  const [data,    setData]    = useState<ExchangePnlSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [window,  setWindow]  = useState<number>(days);

  const refresh = () => {
    if (defer) return;
    setLoading(true); setError('');
    const promise = accountId
      ? getExchangePnl(accountId, window)
      : getMyExchangePnl(window);
    promise
      .then((d) => {
        if (d.error) setError(d.error);
        else         setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [accountId, window, defer]);

  if (defer) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <p className="text-muted text-sm font-sans">Select an account to view exchange-side P&L…</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-elevated/40">
        <Shield size={14} className="text-green" />
        <span className="font-mono font-semibold text-sm text-text">Exchange Realized P&L</span>
        <span className="text-[10px] bg-green/10 text-green border border-green/30 rounded px-1.5 py-0.5 font-mono">
          BINGX TRUTH
        </span>
        <span className="text-xs text-muted font-sans ml-auto hidden md:inline">
          Sourced directly from exchange — includes fees, funding, slippage
        </span>

        <div className="flex items-center gap-1 ml-auto md:ml-3">
          {WINDOWS.map(w => (
            <button
              key={w.days}
              onClick={() => setWindow(w.days)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                window === w.days
                  ? 'bg-green/10 border-green/40 text-green'
                  : 'bg-elevated border-border text-muted hover:text-text'
              }`}
            >
              {w.label}
            </button>
          ))}
          <button
            onClick={refresh}
            disabled={loading}
            className="ml-2 p-1.5 rounded hover:bg-elevated text-muted hover:text-text disabled:opacity-50 cursor-pointer"
            title="Refresh from exchange"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-5">
        {error && (
          <div className="flex items-start gap-2 mb-4 text-red text-xs font-sans bg-red/10 border border-red/20 rounded-lg p-3">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !data ? (
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-elevated rounded-lg" />
            <div className="h-32 bg-elevated rounded-lg" />
          </div>
        ) : data ? (
          <>
            {/* Hero row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <Cell label="Realized P&L">
                <span className={`font-mono font-bold text-xl ${data.realized_pnl >= 0 ? 'text-green' : 'text-red'}`}>
                  {fmtPnl(data.realized_pnl)}
                </span>
              </Cell>
              <Cell label="Closed Trades">
                <span className="font-mono font-semibold text-text text-lg">
                  {data.closed_trades}
                </span>
                <span className="text-[10px] text-muted font-mono ml-1">
                  ({data.wins}W / {data.losses}L)
                </span>
              </Cell>
              <Cell label="Win Rate">
                <span className={`font-mono font-semibold text-lg ${data.win_rate >= 50 ? 'text-green' : data.win_rate >= 40 ? 'text-text' : 'text-red'}`}>
                  {data.win_rate.toFixed(1)}%
                </span>
              </Cell>
              <Cell label="Profit Factor">
                <span className="font-mono font-semibold text-text text-lg">
                  {data.profit_factor != null ? data.profit_factor.toFixed(2) : '—'}
                </span>
              </Cell>
              <Cell label="Volume">
                <span className="font-mono text-text text-sm">
                  ${data.volume.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </Cell>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              <Cell label="Gross Profit" muted>
                <span className="font-mono text-green">
                  {fmtPnl(data.gross_profit)}
                </span>
              </Cell>
              <Cell label="Gross Loss" muted>
                <span className="font-mono text-red">
                  {fmtPnl(data.gross_loss)}
                </span>
              </Cell>
              <Cell label="Fees Paid" muted>
                <span className="font-mono text-muted">
                  -${Math.abs(data.fees).toFixed(4)}
                </span>
              </Cell>
            </div>

            {/* Per-symbol breakdown */}
            {data.by_symbol.length > 0 && (
              <div>
                <p className="text-muted text-[11px] font-sans uppercase tracking-wide mb-2">
                  By Trading Pair (last {data.days}d)
                </p>
                <div className="bg-elevated rounded-lg overflow-x-auto">
                  <table className="w-full text-xs font-sans min-w-[400px]">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="text-left text-muted text-[10px] font-medium px-3 py-2 uppercase tracking-wide">Pair</th>
                        <th className="text-right text-muted text-[10px] font-medium px-3 py-2 uppercase tracking-wide">PnL</th>
                        <th className="text-right text-muted text-[10px] font-medium px-3 py-2 uppercase tracking-wide">Trades</th>
                        <th className="text-right text-muted text-[10px] font-medium px-3 py-2 uppercase tracking-wide">W/L</th>
                        <th className="text-right text-muted text-[10px] font-medium px-3 py-2 uppercase tracking-wide">WR%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_symbol.map((b: ExchangePnlBySymbol) => {
                        const wr = b.count > 0 ? (b.wins / b.count * 100) : 0;
                        return (
                          <tr key={b.symbol} className="border-b border-border/30 last:border-b-0">
                            <td className="px-3 py-2 font-mono font-semibold text-text">{b.symbol}</td>
                            <td className={`px-3 py-2 font-mono text-right ${b.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                              {fmtPnl(b.pnl)}
                            </td>
                            <td className="px-3 py-2 font-mono text-text text-right">{b.count}</td>
                            <td className="px-3 py-2 font-mono text-muted text-right">{b.wins}/{b.losses}</td>
                            <td className={`px-3 py-2 font-mono text-right ${wr >= 50 ? 'text-green' : wr >= 40 ? 'text-text' : 'text-red'}`}>
                              {wr.toFixed(0)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Cell({ label, children, muted }: { label: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${muted ? 'bg-elevated/40' : 'bg-elevated'} rounded-lg px-3 py-2.5`}>
      <span className="text-[10px] text-muted font-sans uppercase tracking-wide">{label}</span>
      <span className="leading-tight">{children}</span>
    </div>
  );
}
