const BASE = '/api';

export function getRole(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('vevi_role') || '';
}

export function canTrade(): boolean {
  const r = getRole();
  return r === 'admin' || r === 'trader';
}

function token(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('vevi_token') || '';
}

function headers(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: headers() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json() as Promise<{ access_token: string; role: string; account_id: string | null }>;
}

// ── Admin: accounts ───────────────────────────────────────────────────────────
export const getAccounts     = ()                    => req<Account[]>('/accounts?active_only=false');
export const pauseAccount    = (id: string)          => req(`/accounts/${id}/pause`, { method: 'PATCH' });
export const activateAccount = (id: string)          => req(`/accounts/${id}/activate`, { method: 'PATCH' });
export const deleteAccount   = (id: string)          => req(`/accounts/${id}`, { method: 'DELETE' });
export const addAccount      = (body: AddAccountBody) =>
  req<Account>('/accounts', { method: 'POST', body: JSON.stringify(body) });
export const updateAccount   = (id: string, body: Partial<AddAccountBody>) =>
  req<Account>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getActivity    = ()            => req<Record<string, Record<string, { status: string; bias: number; detail: string; updated_at: string }>>>('/dashboard/activity');
export const getOverview    = ()            => req<OverviewResponse>('/dashboard/overview');

// Exchange data (lazy-loaded per tab)
export const getOpenOrders      = (id: string, sym?: string) => req<{orders: ExOrder[]}>(`/dashboard/accounts/${id}/open-orders${sym ? `?symbol=${encodeURIComponent(sym)}` : ''}`);
export const getOrderHistory    = (id: string, sym?: string) => req<{orders: ExOrder[]}>(`/dashboard/accounts/${id}/order-history${sym ? `?symbol=${encodeURIComponent(sym)}` : ''}`);
export const getPositionHistory = (id: string, sym?: string) => req<{trades: ExTrade[]}>(`/dashboard/accounts/${id}/position-history${sym ? `?symbol=${encodeURIComponent(sym)}` : ''}`);
export const getTransactions    = (id: string)               => req<{transactions: ExTx[]}>(`/dashboard/accounts/${id}/transactions`);

export const getMyOpenOrders      = (sym?: string) => req<{orders: ExOrder[]}>(`/dashboard/me/open-orders${sym ? `?symbol=${encodeURIComponent(sym)}` : ''}`);
export const getMyOrderHistory    = (sym?: string) => req<{orders: ExOrder[]}>(`/dashboard/me/order-history${sym ? `?symbol=${encodeURIComponent(sym)}` : ''}`);
export const getMyPositionHistory = (sym?: string) => req<{trades: ExTrade[]}>(`/dashboard/me/position-history${sym ? `?symbol=${encodeURIComponent(sym)}` : ''}`);
export const getMyTransactions    = ()              => req<{transactions: ExTx[]}>('/dashboard/me/transactions');
export const getMyDashboard = ()            => req<AccountSnapshot>('/dashboard/me');
export const getAccountSnap = (id: string) => req<AccountSnapshot>(`/dashboard/accounts/${id}`);
export const getTrades      = (id: string, limit = 50) =>
  req<{ trades: Trade[] }>(`/dashboard/accounts/${id}/trades?limit=${limit}`);
export const getMyTrades    = async (limit = 50) => {
  const snap = await getMyDashboard();
  return getTrades(snap.account_id, limit);
};
export const getAdminTrades = (limit = 200) =>
  req<{ trades: AdminTrade[] }>(`/dashboard/admin/trades?limit=${limit}`);

// ── Exchange-side realized PnL (source of truth) ──────────────────────────────
export interface ExchangePnlBySymbol {
  symbol: string;
  pnl: number;
  count: number;
  wins: number;
  losses: number;
}
export interface ExchangePnlSummary {
  days:           number;
  realized_pnl:   number;
  gross_profit:   number;
  gross_loss:     number;
  fees:           number;
  volume:         number;
  closed_trades:  number;
  wins:           number;
  losses:         number;
  win_rate:       number;
  profit_factor:  number | null;
  by_symbol:      ExchangePnlBySymbol[];
  error?:         string;
}
export const getExchangePnl   = (account_id: string, days = 7) =>
  req<ExchangePnlSummary>(`/dashboard/accounts/${account_id}/exchange-pnl?days=${days}`);
export const getMyExchangePnl = (days = 7) =>
  req<ExchangePnlSummary>(`/dashboard/me/exchange-pnl?days=${days}`);

// ── Trading (trader/admin only) ───────────────────────────────────────────────
interface OrderBase { account_id: string; symbol: string; leverage?: number; sl?: number; tp?: number; }
export interface MarketOrderBody extends OrderBase { side: 'buy'|'sell'; usdt_amount: number; }
export interface LimitOrderBody  extends OrderBase { side: 'buy'|'sell'; usdt_amount: number; price: number; }
export interface CloseBody   { account_id: string; symbol: string; }
export interface ModifyBody  { account_id: string; symbol: string; sl?: number; tp?: number; }

export const placeMarket   = (b: MarketOrderBody)  => req<any>('/trading/market',    { method: 'POST', body: JSON.stringify(b) });
export const placeLimit    = (b: LimitOrderBody)   => req<any>('/trading/limit',     { method: 'POST', body: JSON.stringify(b) });
export const closePosition = (b: CloseBody)        => req<any>('/trading/close',     { method: 'POST', body: JSON.stringify(b) });
export const modifySlTp    = (b: ModifyBody)       => req<any>('/trading/sl-tp',     { method: 'PUT',  body: JSON.stringify(b) });
export const closeAll      = (account_id: string)  => req<any>('/trading/close-all', { method: 'POST', body: JSON.stringify({ account_id, symbol: '' }) });

export interface BroadcastOrderBody { symbol: string; side: 'buy'|'sell'; usdt_amount: number; leverage?: number; sl?: number; tp?: number; }
export interface BroadcastResult { account_id: string; account_name: string; ok: boolean; order_id?: string; price?: number; contracts?: number; error?: string; }
export interface BroadcastResponse { ok: boolean; placed: number; total: number; results: BroadcastResult[]; }
export const broadcastTrade = (b: BroadcastOrderBody) => req<BroadcastResponse>('/trading/broadcast', { method: 'POST', body: JSON.stringify(b) });

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Account {
  id: string; name: string; email: string; exchange: string;
  symbols: string[] | null; is_active: boolean; created_at: string; notes: string | null;
}

export interface AddAccountBody {
  name: string; email: string; api_key: string; api_secret: string;
  exchange?: string; symbols?: string[]; notes?: string; member_password?: string;
}

export interface OpenPosition {
  symbol: string; side: string; entry: number; sl: number; tp: number | null;
  size: number; notional: number;
  peak: number | null; trail_sl: number | null; is_trail: boolean;
  trail_tightened?: boolean;
  bar_count: number; opened_at: string | null;
  current_price: number | null;
  unrealized_pct: number | null;
  unrealized_usdt: number | null;
}

export interface AccountSnapshot {
  account_id: string; name: string; email: string; is_active: boolean;
  balance: number; daily_pnl: number; daily_trades: number;
  open_positions: OpenPosition[]; open_count: number;
}

export interface OverviewResponse {
  total_accounts: number; active_accounts: number;
  total_daily_pnl: number; total_balance: number;
  accounts: AccountSnapshot[];
}

export interface Trade {
  id: string; account_id: string; symbol: string; side: string;
  entry: number; exit_price: number | null; pnl: number | null;
  opened_at: string; closed_at: string | null; is_open: number;
}

export interface AdminTrade extends Trade {
  account_name: string;
}

export interface ExOrder {
  id: string; symbol: string; type: string; side: string;
  price: number | null; amount: number; filled: number;
  status: string; datetime: string; timestamp: number;
}

export interface ExTrade {
  id: string; symbol: string; side: string;
  price: number; amount: number; cost: number;
  fee: { cost: number; currency: string } | null;
  datetime: string; timestamp: number;
}

export interface ExTx {
  id: string; type: string; amount: number; currency: string;
  datetime: string; timestamp: number; info?: Record<string, unknown>;
}
