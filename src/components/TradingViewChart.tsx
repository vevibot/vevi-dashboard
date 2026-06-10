'use client';
import { useEffect, useRef } from 'react';

function toTvSymbol(symbol: string, exchange: string): string {
  const clean = symbol.split(':')[0];        // "XRP/USDT"
  const [base, quote] = clean.split('/');    // "XRP", "USDT"
  if (exchange === 'hyperliquid') return `HYPERLIQUID:${base}USDT`;
  return `BINANCE:${base}${quote}.P`;
}

interface Props {
  symbol: string;
  exchange: string;
  height?: number | string;
  allowSymbolChange?: boolean;
}

export function TradingViewChart({ symbol, exchange, height = 420, allowSymbolChange = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.cssText = 'height:100%;width:100%';
    ref.current.appendChild(wrapper);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: toTvSymbol(symbol, exchange),
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#020617',
      gridColor: 'rgba(148,163,184,0.06)',
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: allowSymbolChange,
      save_image: false,
      calendar: false,
      show_popup_button: true,
      support_host: 'https://www.tradingview.com',
    });
    ref.current.appendChild(script);
  }, [symbol, exchange, allowSymbolChange]);

  return (
    <div
      ref={ref}
      className="tradingview-widget-container w-full h-full rounded-xl overflow-hidden"
      style={{ height }}
    />
  );
}
