'use client';
import { useState } from 'react';
import { placeMarket, placeLimit, closePosition, modifySlTp } from '@/lib/api';

interface Props {
  accountId: string;
  symbol: string;
  exchange: string;
  onDone?: () => void;
}

type Tab = 'market' | 'limit' | 'close' | 'sltp';

const TABS: { id: Tab; label: string }[] = [
  { id: 'market', label: 'Market' },
  { id: 'limit',  label: 'Limit'  },
  { id: 'close',  label: 'Close'  },
  { id: 'sltp',   label: 'SL / TP'},
];

const input = 'w-full bg-elevated border border-border rounded-lg px-3 py-2 text-text font-mono text-sm placeholder:text-muted/40 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/20';
const label = 'text-muted text-xs font-sans mb-1 block';

export function OrderPanel({ accountId, symbol, exchange, onDone }: Props) {
  const [tab, setTab]       = useState<Tab>('market');
  const [side, setSide]     = useState<'buy' | 'sell'>('buy');
  const [usdt, setUsdt]     = useState('');
  const [price, setPrice]   = useState('');
  const [sl, setSl]         = useState('');
  const [tp, setTp]         = useState('');
  const [leverage, setLev]  = useState('10');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  const clean = symbol.replace(/:[A-Z]+$/, '').replace('/', '');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const base = { account_id: accountId, symbol, leverage: Number(leverage) };
      if (tab === 'market') {
        const r = await placeMarket({ ...base, side, usdt_amount: Number(usdt), sl: sl ? Number(sl) : undefined, tp: tp ? Number(tp) : undefined });
        setResult({ ok: true, msg: `Filled @ ~$${r.fill_price?.toFixed(4)} · ${r.contracts} contracts` });
      } else if (tab === 'limit') {
        const r = await placeLimit({ ...base, side, usdt_amount: Number(usdt), price: Number(price), sl: sl ? Number(sl) : undefined, tp: tp ? Number(tp) : undefined });
        setResult({ ok: true, msg: `Limit placed @ $${r.price} · ${r.contracts} contracts` });
      } else if (tab === 'close') {
        const r = await closePosition({ account_id: accountId, symbol });
        setResult({ ok: true, msg: `Closed ${r.side?.toUpperCase()} · ${r.closed} contracts` });
      } else {
        const r = await modifySlTp({ account_id: accountId, symbol, sl: sl ? Number(sl) : undefined, tp: tp ? Number(tp) : undefined });
        setResult({ ok: true, msg: `Updated: ${r.modified?.join(', ') || 'none'}` });
      }
      onDone?.();
    } catch (err: any) {
      setResult({ ok: false, msg: err.message || 'Order failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4">
      {/* Symbol header */}
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold text-text">{clean}</span>
        <span className="text-xs text-muted font-sans uppercase">{exchange}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-elevated rounded-lg p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setResult(null); }}
            className={`flex-1 text-xs font-sans py-1.5 rounded-md transition-colors cursor-pointer ${
              tab === t.id ? 'bg-surface text-text font-medium' : 'text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {/* Buy / Sell toggle (not for close/sltp) */}
        {(tab === 'market' || tab === 'limit') && (
          <div className="flex gap-2">
            {(['buy', 'sell'] as const).map(s => (
              <button
                key={s} type="button"
                onClick={() => setSide(s)}
                className={`flex-1 py-2 rounded-lg text-sm font-sans font-medium transition-colors cursor-pointer ${
                  side === s
                    ? s === 'buy' ? 'bg-green text-bg' : 'bg-red text-white'
                    : 'bg-elevated text-muted hover:text-text'
                }`}
              >
                {s === 'buy' ? 'Long' : 'Short'}
              </button>
            ))}
          </div>
        )}

        {/* Amount + leverage */}
        {(tab === 'market' || tab === 'limit') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Size (USDT)</label>
              <input required type="number" min="1" step="any" value={usdt} onChange={e => setUsdt(e.target.value)} placeholder="100" className={input} />
            </div>
            <div>
              <label className={label}>Leverage ×</label>
              <input required type="number" min="1" max="50" value={leverage} onChange={e => setLev(e.target.value)} placeholder="10" className={input} />
            </div>
          </div>
        )}

        {/* Limit price */}
        {tab === 'limit' && (
          <div>
            <label className={label}>Limit Price</label>
            <input required type="number" step="any" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.0000" className={input} />
          </div>
        )}

        {/* SL / TP (shared across market, limit, sltp) */}
        {(tab === 'market' || tab === 'limit' || tab === 'sltp') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Stop Loss</label>
              <input type="number" step="any" value={sl} onChange={e => setSl(e.target.value)} placeholder="Optional" className={input} />
            </div>
            <div>
              <label className={label}>Take Profit</label>
              <input type="number" step="any" value={tp} onChange={e => setTp(e.target.value)} placeholder="Optional" className={input} />
            </div>
          </div>
        )}

        {/* Close: no extra inputs, just confirmation */}
        {tab === 'close' && (
          <p className="text-muted text-sm font-sans bg-elevated rounded-lg px-3 py-2">
            Market-close entire open position for <span className="font-mono text-text">{clean}</span>
          </p>
        )}

        {/* Result */}
        {result && (
          <p className={`text-sm font-sans rounded-lg px-3 py-2 ${
            result.ok ? 'text-green bg-green/5 border border-green/20' : 'text-red bg-red/5 border border-red/20'
          }`}>
            {result.ok ? '✓ ' : '✗ '}{result.msg}
          </p>
        )}

        <button
          type="submit" disabled={loading}
          className={`w-full py-2.5 rounded-lg font-sans font-semibold text-sm transition-colors cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            ${tab === 'close'
              ? 'bg-red text-white hover:bg-red/90'
              : side === 'buy' || tab === 'sltp'
                ? 'bg-green text-bg hover:bg-green/90'
                : 'bg-red text-white hover:bg-red/90'
            }`}
        >
          {loading ? 'Placing…' : tab === 'market' ? `Market ${side === 'buy' ? 'Long' : 'Short'}`
            : tab === 'limit' ? `Limit ${side === 'buy' ? 'Long' : 'Short'}`
            : tab === 'close' ? 'Close Position'
            : 'Update SL / TP'}
        </button>
      </form>
    </div>
  );
}
