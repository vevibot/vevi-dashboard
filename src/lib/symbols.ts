/**
 * Centralized symbol catalogues.
 * Keep ALL token references in the UI pointing at these constants — never hard-code
 * lists in individual components again.
 */

// The 10 symbols the strategy bot is actively trading.
// Must mirror DEFAULT_SYMBOLS in /vevi_trading_bot/config.py.
export const STRATEGY_BASES = [
  'SUI', 'HYPE', 'TIA', 'NEAR', 'OP',
  'JTO', 'SEI', 'STRK', 'FET', 'APT',
] as const;

export const STRATEGY_SYMBOLS = STRATEGY_BASES.map(b => `${b}/USDT:USDT`);

// Broader catalogue for MANUAL trading + filter dropdowns.
// Sourced from popular BingX USDT-M perpetuals, alphabetised.
// Manual trading should never be restricted to the strategy symbol set.
export const MANUAL_TRADE_BASES = [
  // Majors
  'BTC', 'ETH', 'SOL', 'BNB',
  // Strategy 10 (overlap intentional — admin sees them with [bot] tag in UI)
  'SUI', 'HYPE', 'TIA', 'NEAR', 'OP', 'JTO', 'SEI', 'STRK', 'FET', 'APT',
  // Top alts
  'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'LTC', 'BCH', 'TRX', 'UNI', 'MATIC',
  // L1 / L2 / infrastructure
  'ARB', 'INJ', 'ATOM', 'FIL', 'ICP', 'TON', 'KAS',
  // DeFi
  'AAVE', 'MKR', 'COMP', 'CRV', 'SNX', 'LDO', 'RUNE', 'DYDX', 'GMX',
  // AI / data
  'RNDR', 'GRT', 'OCEAN', 'AGIX', 'WLD',
  // Memes / momentum
  'PEPE', 'SHIB', 'FLOKI', 'BONK', 'WIF', 'ORDI', '1000SATS',
  // 2024-26 launches
  'PYTH', 'PENDLE', 'ETHFI', 'JUP', 'ENA',
].sort();

export const MANUAL_TRADE_BASES_UNIQUE = Array.from(new Set(MANUAL_TRADE_BASES));

// Helpers
export function toUsdtPerp(base: string): string {
  return `${base.toUpperCase()}/USDT:USDT`;
}

export function toBinanceTV(base: string): string {
  return `BINANCE:${base.toUpperCase()}USDT.P`;
}

export function isStrategySymbol(base: string): boolean {
  return (STRATEGY_BASES as readonly string[]).includes(base.toUpperCase());
}

export function baseFromSymbol(sym: string): string {
  return sym.split('/')[0];
}
