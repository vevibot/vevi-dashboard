'use client';
import { useState } from 'react';
import { broadcastTrade, BroadcastResult } from '@/lib/api';
import { X, Radio, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { MANUAL_TRADE_BASES_UNIQUE, toUsdtPerp, isStrategySymbol } from '@/lib/symbols';

// Manual broadcast — full catalogue, not limited to the strategy 10.
const SYMBOLS = MANUAL_TRADE_BASES_UNIQUE.map(toUsdtPerp);

interface Props { onClose: () => void; }

export function BroadcastModal({ onClose }: Props) {
  const [symbol,  setSymbol]  = useState(SYMBOLS[0]);
  const [side,    setSide]    = useState<'buy'|'sell'>('buy');
  const [amount,  setAmount]  = useState('10');
  const [leverage, setLev]   = useState('20');
  const [sl,      setSl]     = useState('');
  const [tp,      setTp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BroadcastResult[] | null>(null);
  const [error,   setError]  = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResults(null);
    try {
      const res = await broadcastTrade({
        symbol,
        side,
        usdt_amount: parseFloat(amount),
        leverage:    parseInt(leverage),
        sl:          sl ? parseFloat(sl) : undefined,
        tp:          tp ? parseFloat(tp) : undefined,
      });
      setResults(res.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-surface border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-green" />
            <span className="font-mono font-semibold text-text text-sm">Broadcast Trade</span>
            <span className="text-[10px] bg-green/10 text-green border border-green/30 rounded px-1.5 py-0.5 font-mono">ALL ACCOUNTS</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!results ? (
            <>
              {/* Symbol */}
              <div>
                <label className="block text-xs text-muted font-sans mb-1.5">Symbol</label>
                <select
                  value={symbol} onChange={e => setSymbol(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono text-text focus:outline-none focus:border-green/60 cursor-pointer"
                >
                  {SYMBOLS.map(s => {
                    const base = s.split('/')[0];
                    const tag  = isStrategySymbol(base) ? ' · bot' : '';
                    return <option key={s} value={s}>{base}{tag}</option>;
                  })}
                </select>
              </div>

              {/* Side */}
              <div>
                <label className="block text-xs text-muted font-sans mb-1.5">Direction</label>
                <div className="flex gap-2">
                  {(['buy', 'sell'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSide(s)}
                      className={`flex-1 py-2 rounded-lg text-sm font-mono font-semibold transition-colors cursor-pointer border ${
                        side === s
                          ? s === 'buy'
                            ? 'bg-green/15 text-green border-green/40'
                            : 'bg-red/15 text-red border-red/40'
                          : 'bg-elevated text-muted border-border'
                      }`}
                    >
                      {s === 'buy' ? '▲ LONG' : '▼ SHORT'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount + Leverage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted font-sans mb-1.5">USDT Amount</label>
                  <input
                    type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono text-text focus:outline-none focus:border-green/60"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted font-sans mb-1.5">Leverage</label>
                  <input
                    type="number" value={leverage} onChange={e => setLev(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono text-text focus:outline-none focus:border-green/60"
                    placeholder="20"
                  />
                </div>
              </div>

              {/* SL + TP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted font-sans mb-1.5">Stop Loss <span className="text-muted/60">(optional)</span></label>
                  <input
                    type="number" value={sl} onChange={e => setSl(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono text-text focus:outline-none focus:border-green/60"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted font-sans mb-1.5">Take Profit <span className="text-muted/60">(optional)</span></label>
                  <input
                    type="number" value={tp} onChange={e => setTp(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono text-text focus:outline-none focus:border-green/60"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {error && <p className="text-red text-xs font-sans">{error}</p>}

              <button
                onClick={submit} disabled={loading}
                className="w-full py-2.5 rounded-xl font-mono font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 bg-green/15 text-green border border-green/40 hover:bg-green/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Broadcasting…</> : <><Radio size={14} /> Broadcast to All Accounts</>}
              </button>
            </>
          ) : (
            <>
              <p className="text-muted text-xs font-sans mb-3">
                Placed on {results.filter(r => r.ok).length}/{results.length} accounts
              </p>
              <div className="space-y-2">
                {results.map(r => (
                  <div key={r.account_id} className={`flex items-start gap-3 p-3 rounded-lg border ${r.ok ? 'bg-green/5 border-green/20' : 'bg-red/5 border-red/20'}`}>
                    {r.ok
                      ? <CheckCircle2 size={14} className="text-green mt-0.5 shrink-0" />
                      : <XCircle     size={14} className="text-red   mt-0.5 shrink-0" />
                    }
                    <div className="min-w-0 flex-1">
                      <p className="text-text text-xs font-medium font-sans truncate">{r.account_name}</p>
                      {r.ok
                        ? <p className="text-muted text-[11px] font-mono">@ {r.price?.toFixed(4)} | {r.contracts} lots</p>
                        : <p className="text-red text-[11px] font-sans truncate">{r.error}</p>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full mt-2 py-2 rounded-xl font-mono font-semibold text-sm bg-elevated text-muted border border-border hover:text-text transition-colors cursor-pointer"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
