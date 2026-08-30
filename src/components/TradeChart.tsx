'use client';
import { useEffect, useRef, useState } from 'react';
import {
  createChart, ColorType, CrosshairMode, LineStyle,
  type IChartApi, type ISeriesApi, type IPriceLine, type UTCTimestamp, type SeriesMarker,
  type CandlestickData,
} from 'lightweight-charts';
import {
  fetchKlines, fetchKlinesRange, fetchProxyKlines, fetchOlder, fetchProxyOlder,
} from '@/lib/marketData';

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

type Candle = CandlestickData<UTCTimestamp>;
type Status = 'loading' | 'ready' | 'empty';

export function TradeChart({ binanceSym, interval, range, trades, selectedId, onSelect }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const tradesRef = useRef<UITrade[]>(trades);
  const selRef = useRef<string | null | undefined>(selectedId);
  const onSelRef = useRef(onSelect);
  tradesRef.current = trades; selRef.current = selectedId; onSelRef.current = onSelect;

  // Loaded candle data (ascending, deduped) — kept in a ref so lazy-paging can
  // prepend older bars without a full re-fetch.
  const dataRef = useRef<Candle[]>([]);
  const loadingRef = useRef(false);       // guards concurrent older-page fetches
  const exhaustedRef = useRef(false);     // stop paging once history runs out
  const sourceRef = useRef<'binance' | 'proxy'>('binance');
  const symRef = useRef(binanceSym);
  const intervalRef = useRef(interval);
  symRef.current = binanceSym; intervalRef.current = interval;

  const [status, setStatus] = useState<Status>('loading');
  const baseLabel = binanceSym.replace(/USDT$/, '');

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
      time: snap(sel.closeTime), position: 'inBar', color: '#8A8A8A',
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
      L(sel.entry, '#B0B0B0', 'ENTRY', true);   // neutral reference
      L(sel.sl, '#FF3131', 'SL');               // risk → red
      L(sel.tp, '#4DA3FF', 'TP');               // target → accent
      L(sel.exit, '#8A8A8A', 'EXIT');           // neutral
    }
  }

  // Merge older bars in front of the current data (dedupe by time, keep ascending).
  function mergeOlder(older: Candle[]): Candle[] {
    const cur = dataRef.current;
    const seen = new Set(cur.map(d => d.time as number));
    const add = older.filter(c => !seen.has(c.time as number));
    if (add.length === 0) return cur;
    const merged = [...add, ...cur];
    merged.sort((a, b) => (a.time as number) - (b.time as number));
    return merged;
  }

  // Lazy-page: fetch OLDER candles ending before the earliest loaded bar and
  // prepend them. Never calls fitContent (that would reset the user's zoom).
  async function loadOlder() {
    if (loadingRef.current || exhaustedRef.current) return;
    const cur = dataRef.current;
    if (cur.length === 0) return;
    loadingRef.current = true;
    try {
      const endMs = (cur[0].time as number) * 1000;
      const older = sourceRef.current === 'proxy'
        ? await fetchProxyOlder(symRef.current.replace(/USDT$/, ''), intervalRef.current, endMs, 300)
        : await fetchOlder(symRef.current, intervalRef.current, endMs, 300);
      if (older.length === 0) { exhaustedRef.current = true; return; }
      const converted: Candle[] = older.map(k => ({
        time: Math.floor(k.openTime / 1000) as UTCTimestamp,
        open: k.open, high: k.high, low: k.low, close: k.close,
      }));
      const merged = mergeOlder(converted);
      if (merged.length === cur.length) { exhaustedRef.current = true; return; }
      dataRef.current = merged;
      seriesRef.current?.setData(merged);   // prepend — keep current zoom, NO fitContent
    } finally {
      loadingRef.current = false;
    }
  }
  const loadOlderRef = useRef(loadOlder);
  loadOlderRef.current = loadOlder;

  // create chart once
  useEffect(() => {
    const el = elRef.current; if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#000000' }, textColor: '#8A8A8A',
        fontSize: 11, fontFamily: 'Fira Code, monospace' },
      grid: { vertLines: { color: '#1E1E1E' }, horzLines: { color: '#1E1E1E' } },
      rightPriceScale: { borderColor: '#1E1E1E' },
      timeScale: { borderColor: '#1E1E1E', timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(138,138,138,.45)', labelBackgroundColor: '#333333' },
        horzLine: { color: 'rgba(138,138,138,.45)', labelBackgroundColor: '#333333' } },
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
    // Lazy-paging: when the visible window nears the left edge, load older bars.
    chart.timeScale().subscribeVisibleLogicalRangeChange(r => {
      if (r && r.from < 10) loadOlderRef.current();
    });
    return () => { chart.remove(); chartRef.current = null; seriesRef.current = null; linesRef.current = []; };
  }, []);

  // fetch candles when symbol / interval / range changes
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    exhaustedRef.current = false;
    loadingRef.current = false;
    (async () => {
      let candles = range
        ? await fetchKlinesRange(binanceSym, interval, range.startMs, range.endMs)
        : await fetchKlines(binanceSym, interval, 300);
      let source: 'binance' | 'proxy' = 'binance';
      if (candles.length === 0) {
        // Binance doesn't list this market (e.g. HYPE) → our BingX candle proxy
        candles = await fetchProxyKlines(binanceSym.replace(/USDT$/, ''), interval, 300);
        source = 'proxy';
      }
      if (cancelled || !seriesRef.current) return;

      if (candles.length === 0) {
        dataRef.current = [];
        seriesRef.current.setData([]);
        applyOverlays();
        setStatus('empty');
        return;
      }

      sourceRef.current = source;
      const converted: Candle[] = candles
        .map(k => ({
          time: Math.floor(k.openTime / 1000) as UTCTimestamp,
          open: k.open, high: k.high, low: k.low, close: k.close,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))
        .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);   // dedupe boundary bars
      dataRef.current = converted;
      seriesRef.current.setData(converted);
      applyOverlays();
      chartRef.current?.timeScale().fitContent();
      setStatus('ready');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binanceSym, interval, range?.startMs, range?.endMs]);

  // re-apply markers / lines when trades or selection change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { applyOverlays(); }, [trades, selectedId]);

  return (
    <div className="relative w-full h-full">
      <div ref={elRef} className="w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/60 backdrop-blur-[1px] pointer-events-none">
          <div className="flex items-center gap-2 text-muted text-xs font-mono">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-green/30 border-t-green animate-spin" />
            Loading {baseLabel} candles…
          </div>
        </div>
      )}

      {status === 'empty' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-bg/40 pointer-events-none px-4 text-center">
          <span className="text-secondary text-sm font-mono">No candle data for {baseLabel}</span>
          <span className="text-muted text-[11px] font-sans">Not listed on Binance or BingX — check the symbol.</span>
        </div>
      )}
    </div>
  );
}
