'use client';
import { useEffect, useRef } from 'react';
import {
  createChart, ColorType, CrosshairMode, LineStyle,
  type IChartApi, type ISeriesApi, type IPriceLine, type UTCTimestamp, type SeriesMarker,
} from 'lightweight-charts';
import { fetchKlines, fetchKlinesRange } from '@/lib/marketData';

export interface UITrade {
  id: string; side: 'buy' | 'sell';
  entry: number; sl?: number | null; tp?: number | null; exit?: number | null;
  size?: number | null; notional?: number | null; leverage?: number | null;
  openTime: number; closeTime?: number | null;
  pnlR?: number | null; pnlUsd?: number | null; reason?: string; conf?: number; account?: string;
}

interface Props {
  binanceSym: string;
  interval: string;
  range?: { startMs: number; endMs: number } | null;
  trades: UITrade[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const SEC: Record<string, number> = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600 };

export function TradeChart({ binanceSym, interval, range, trades, selectedId, onSelect }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const tradesRef = useRef<UITrade[]>(trades);
  const selRef = useRef<string | null | undefined>(selectedId);
  const onSelRef = useRef(onSelect);
  tradesRef.current = trades; selRef.current = selectedId; onSelRef.current = onSelect;

  function applyOverlays() {
    const s = seriesRef.current; if (!s) return;
    const sec = SEC[interval] || 300;
    const snap = (t: number) => (Math.floor(t / sec) * sec) as UTCTimestamp;
    const sel = tradesRef.current.find(t => t.id === selRef.current) || null;
    const markers: SeriesMarker<UTCTimestamp>[] = tradesRef.current.map(t => {
      const buy = t.side === 'buy';
      return {
        time: snap(t.openTime), position: buy ? 'belowBar' : 'aboveBar',
        color: buy ? '#00FF41' : '#FF3131', shape: buy ? 'arrowUp' : 'arrowDown',
        text: `${buy ? 'BUY' : 'SELL'} ${t.size ?? ''} @ ${t.entry}`,
      };
    });
    if (sel && sel.closeTime) markers.push({
      time: snap(sel.closeTime), position: 'inBar', color: '#B78BFF',
      shape: 'circle', text: `EXIT ${sel.exit ?? ''}`,
    });
    markers.sort((a, b) => (a.time as number) - (b.time as number));
    s.setMarkers(markers);

    linesRef.current.forEach(l => s.removePriceLine(l)); linesRef.current = [];
    if (sel) {
      const L = (price: number | null | undefined, color: string, title: string, solid = false) => {
        if (price == null) return;
        linesRef.current.push(s.createPriceLine({
          price, color, lineWidth: 1, lineStyle: solid ? LineStyle.Solid : LineStyle.Dashed,
          axisLabelVisible: true, title,
        }));
      };
      L(sel.entry, '#CFE9DA', 'ENTRY', true);
      L(sel.sl, '#FF3131', 'SL');
      L(sel.tp, '#4DD2FF', 'TP');
      L(sel.exit, '#B78BFF', 'EXIT');
    }
  }

  // create chart once
  useEffect(() => {
    const el = elRef.current; if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#000000' }, textColor: '#555555',
        fontSize: 11, fontFamily: 'Fira Code, monospace' },
      grid: { vertLines: { color: 'rgba(0,255,65,.045)' }, horzLines: { color: 'rgba(0,255,65,.045)' } },
      rightPriceScale: { borderColor: '#1E1E1E' },
      timeScale: { borderColor: '#1E1E1E', timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(0,255,65,.35)', labelBackgroundColor: '#00FF41' },
        horzLine: { color: 'rgba(0,255,65,.35)', labelBackgroundColor: '#00FF41' } },
    });
    const series = chart.addCandlestickSeries({
      upColor: '#00FF41', downColor: '#FF3131', wickUpColor: '#00FF41', wickDownColor: '#FF3131',
      borderVisible: false,
    });
    chartRef.current = chart; seriesRef.current = series;
    chart.subscribeClick(param => {
      const cb = onSelRef.current; if (!cb || param.time == null) return;
      let best: UITrade | null = null, bd = Infinity;
      for (const t of tradesRef.current) {
        const d = Math.abs(t.openTime - (param.time as number));
        if (d < bd) { bd = d; best = t; }
      }
      if (best && bd < 7200) cb(best.id);
    });
    return () => { chart.remove(); chartRef.current = null; seriesRef.current = null; linesRef.current = []; };
  }, []);

  // fetch candles when symbol / interval / range changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const candles = range
        ? await fetchKlinesRange(binanceSym, interval, range.startMs, range.endMs)
        : await fetchKlines(binanceSym, interval, 300);
      if (cancelled || !seriesRef.current) return;
      seriesRef.current.setData(candles.map(k => ({
        time: Math.floor(k.openTime / 1000) as UTCTimestamp,
        open: k.open, high: k.high, low: k.low, close: k.close,
      })));
      applyOverlays();
      chartRef.current?.timeScale().fitContent();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binanceSym, interval, range?.startMs, range?.endMs]);

  // re-apply markers / lines when trades or selection change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { applyOverlays(); }, [trades, selectedId]);

  return <div ref={elRef} className="w-full h-full" />;
}
