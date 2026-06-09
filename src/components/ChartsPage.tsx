'use client';
import { useState } from 'react';
import { TradingViewChart } from './TradingViewChart';

const SYMBOLS = [
  { label: 'XRP',  bingx: 'XRP/USDT:USDT',   hl: 'XRP/USDC:USDC'  },
  { label: 'ETH',  bingx: 'ETH/USDT:USDT',   hl: 'ETH/USDC:USDC'  },
  { label: 'LINK', bingx: 'LINK/USDT:USDT',  hl: 'LINK/USDC:USDC' },
  { label: 'SUI',  bingx: 'SUI/USDT:USDT',   hl: 'SUI/USDC:USDC'  },
  { label: 'HYPE', bingx: 'HYPE/USDT:USDT',  hl: 'HYPE/USDC:USDC' },
  { label: 'OP',   bingx: 'OP/USDT:USDT',    hl: 'OP/USDC:USDC'   },
  { label: 'BTC',  bingx: 'BTC/USDT:USDT',   hl: 'BTC/USDC:USDC'  },
  { label: 'SOL',  bingx: 'SOL/USDT:USDT',   hl: 'SOL/USDC:USDC'  },
];

export function ChartsPage() {
  const [exchange, setExchange] = useState<'bingx' | 'hyperliquid'>('bingx');
  const [active, setActive]     = useState(SYMBOLS[0]);

  const symbol = exchange === 'bingx' ? active.bingx : active.hl;

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface shrink-0 flex-wrap">
        {/* Symbol tabs */}
        <div className="flex gap-1 flex-wrap">
          {SYMBOLS.map(s => (
            <button
              key={s.label}
              onClick={() => setActive(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                active.label === s.label
                  ? 'bg-green/10 text-green border border-green/30'
                  : 'bg-elevated text-muted hover:text-text border border-transparent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Exchange toggle */}
        <div className="ml-auto flex gap-1 bg-elevated rounded-lg p-1">
          {(['bingx', 'hyperliquid'] as const).map(ex => (
            <button
              key={ex}
              onClick={() => setExchange(ex)}
              className={`px-3 py-1.5 rounded-md text-xs font-sans transition-colors cursor-pointer ${
                exchange === ex ? 'bg-surface text-text font-medium' : 'text-muted hover:text-text'
              }`}
            >
              {ex === 'bingx' ? 'BingX' : 'Hyperliquid'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — fills remaining height */}
      <div className="flex-1 min-h-0 p-3">
        <TradingViewChart
          key={symbol}
          symbol={symbol}
          exchange={exchange}
          height="100%"
        />
      </div>
    </div>
  );
}
