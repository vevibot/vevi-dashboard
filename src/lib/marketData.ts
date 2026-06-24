/**
 * Binance public market-data helper.
 * Free, no auth, browser-callable. Used by the Activity grid for live prices.
 */
const BINANCE_BASE = 'https://api.binance.com/api/v3';

export interface TickerData {
  symbol: string;       // e.g. "LINKUSDT"
  base: string;         // e.g. "LINK"
  price: number;
  change24h: number;    // percent
  volume24h: number;    // base asset
  high24h: number;
  low24h: number;
}

export interface KlineCandle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** 'LINK/USDT:USDT' or 'LINK/USDC:USDC' → 'LINKUSDT' (Binance uses USDT spot) */
export function symbolToBinance(vSym: string): string {
  const base = vSym.split('/')[0];
  return `${base}USDT`;
}

export async function fetchTicker(binanceSym: string): Promise<TickerData | null> {
  try {
    const res = await fetch(`${BINANCE_BASE}/ticker/24hr?symbol=${binanceSym}`);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      symbol: d.symbol,
      base: d.symbol.replace('USDT', ''),
      price: parseFloat(d.lastPrice),
      change24h: parseFloat(d.priceChangePercent),
      volume24h: parseFloat(d.volume),
      high24h: parseFloat(d.highPrice),
      low24h: parseFloat(d.lowPrice),
    };
  } catch {
    return null;
  }
}

export async function fetchKlines(
  binanceSym: string,
  interval = '15m',
  limit = 24,
): Promise<KlineCandle[]> {
  try {
    const res = await fetch(`${BINANCE_BASE}/klines?symbol=${binanceSym}&interval=${interval}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((k: any[]) => ({
      openTime: k[0],
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch {
    return [];
  }
}

/** Klines over a fixed time range — used to align trade markers with candles. */
export async function fetchKlinesRange(
  binanceSym: string,
  interval: string,
  startMs: number,
  endMs: number,
): Promise<KlineCandle[]> {
  try {
    const res = await fetch(
      `${BINANCE_BASE}/klines?symbol=${binanceSym}&interval=${interval}` +
      `&startTime=${startMs}&endTime=${endMs}&limit=1000`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((k: any[]) => ({
      openTime: k[0],
      open: parseFloat(k[1]), high: parseFloat(k[2]),
      low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]),
    }));
  } catch {
    return [];
  }
}

export async function fetchAllTickers(symbols: string[]): Promise<Record<string, TickerData>> {
  const results = await Promise.all(symbols.map(fetchTicker));
  const map: Record<string, TickerData> = {};
  results.forEach((t, i) => { if (t) map[symbols[i]] = t; });
  return map;
}

export async function fetchAllKlines(symbols: string[]): Promise<Record<string, KlineCandle[]>> {
  const results = await Promise.all(symbols.map(s => fetchKlines(s)));
  const map: Record<string, KlineCandle[]> = {};
  results.forEach((k, i) => { map[symbols[i]] = k; });
  return map;
}
