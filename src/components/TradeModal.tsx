'use client';
import { X } from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { OrderPanel } from './OrderPanel';

function toTvSymbol(symbol: string): string {
  const base = symbol.split('/')[0];
  return `BINANCE:${base}USDT.P`;
}

interface Props {
  accountId: string;
  symbol: string;
  exchange: string;
  canTrade: boolean;
  onClose: () => void;
  onDone?: () => void;
}

export function TradeModal({ accountId, symbol, exchange, canTrade, onClose, onDone }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-bg border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
          <div>
            <span className="font-mono font-semibold text-text">
              {symbol.replace(/:[A-Z]+$/, '').replace('/', '')}
            </span>
            <span className="ml-2 text-xs text-muted font-sans uppercase">{exchange}</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors cursor-pointer rounded-lg p-1 hover:bg-elevated"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row gap-0 overflow-hidden flex-1">
          {/* Chart */}
          <div className="flex-1 min-h-[300px] lg:min-h-0 p-3">
            <TradingViewChart symbol={toTvSymbol(symbol)} height={500} />
          </div>

          {/* Order panel — only for trader/admin */}
          {canTrade && (
            <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-3 overflow-y-auto">
              <OrderPanel
                accountId={accountId}
                symbol={symbol}
                exchange={exchange}
                onDone={onDone}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
