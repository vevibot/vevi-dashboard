'use client';
import { useState } from 'react';
import { TradingViewChart } from './TradingViewChart';

const SYMBOLS = [
  { label: 'SUI',  tv: 'BINANCE:SUIUSDT.P'  },
  { label: 'HYPE', tv: 'BINANCE:HYPEUSDT.P' },
  { label: 'TIA',  tv: 'BINANCE:TIAUSDT.P'  },
  { label: 'NEAR', tv: 'BINANCE:NEARUSDT.P' },
  { label: 'OP',   tv: 'BINANCE:OPUSDT.P'   },
  { label: 'JTO',  tv: 'BINANCE:JTOUSDT.P'  },
  { label: 'SEI',  tv: 'BINANCE:SEIUSDT.P'  },
  { label: 'STRK', tv: 'BINANCE:STRKUSDT.P' },
  { label: 'FET',  tv: 'BINANCE:FETUSDT.P'  },
  { label: 'APT',  tv: 'BINANCE:APTUSDT.P'  },
];

export function ChartsPage() {
  const [active, setActive] = useState(SYMBOLS[0]);

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface shrink-0 flex-wrap">
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
      </div>

      {/* Chart — fills remaining height */}
      <div className="flex-1 min-h-0 p-3">
        <TradingViewChart
          key={active.tv}
          symbol={active.tv}
          height="100%"
        />
      </div>
    </div>
  );
}
