const BASE = '/api';

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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getOverview    = ()            => req<OverviewResponse>('/dashboard/overview');
export const getMyDashboard = ()            => req<AccountSnapshot>('/dashboard/me');
export const getAccountSnap = (id: string) => req<AccountSnapshot>(`/dashboard/accounts/${id}`);
export const getTrades      = (id: string, limit = 50) =>
  req<{ trades: Trade[] }>(`/dashboard/accounts/${id}/trades?limit=${limit}`);
export const getMyTrades    = async (limit = 50) => {
  const snap = await getMyDashboard();
  return getTrades(snap.account_id, limit);
};

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
  peak: number | null; trail_sl: number | null; is_trail: boolean;
  bar_count: number; opened_at: string | null;
}

export interface AccountSnapshot {
  account_id: string; name: string; email: string; is_active: boolean;
  daily_pnl: number; daily_trades: number;
  open_positions: OpenPosition[]; open_count: number;
}

export interface OverviewResponse {
  total_accounts: number; active_accounts: number; total_daily_pnl: number;
  accounts: AccountSnapshot[];
}

export interface Trade {
  id: string; account_id: string; symbol: string; side: string;
  entry: number; exit_price: number | null; pnl: number | null;
  opened_at: string; closed_at: string | null; is_open: number;
}
