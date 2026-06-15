'use client';
import { useState } from 'react';
import { TradingViewChart } from './TradingViewChart';
import { MANUAL_TRADE_BASES_UNIQUE, toBinanceTV, isStrategySymbol } from '@/lib/symbols';

// All manual-tradeable symbols — pick any chart to inspect even if the bot
// isn't trading it. Strategy symbols are visually distinguished.
const SYMBOLS = MANUAL_TRADE_BASES_UNIQUE.map(base => ({
  label: base,
  tv:    toBinanceTV(base),
  bot:   isStrategySymbol(base),
}));

export function ChartsPage() {
  const [active, setActive] = useState(SYMBOLS[0]);

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 md:px-5 py-3 border-b border-border bg-surface shrink-0">
        <div className="flex gap-1 flex-wrap overflow-x-auto max-h-20">
          {SYMBOLS.map(s => (
            <button
              key={s.label}
              onClick={() => setActive(s)}
              title={s.bot ? `${s.label} — bot is trading` : `${s.label} — manual only`}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                active.label === s.label
                  ? 'bg-green/15 text-green border-green/40'
                  : s.bot
                    ? 'bg-green/5 text-green/80 border-green/20 hover:border-green/40'
                    : 'bg-elevated text-muted border-transparent hover:text-text'
              }`}
            >
              {s.bot && active.label !== s.label && (
                <span className="absolute top-0.5 right-1 w-1 h-1 rounded-full bg-green" />
              )}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — fills remaining height */}
      <div className="flex-1 min-h-0 p-2 md:p-3">
        <TradingViewChart
          key={active.tv}
          symbol={active.tv}
          height="100%"
        />
      </div>
    </div>
  );
}
