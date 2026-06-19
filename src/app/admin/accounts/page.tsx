'use client';
import { useEffect, useState } from 'react';
import {
  getAccounts, getAccountSnap, getOverview, pauseAccount, activateAccount, deleteAccount,
  addAccount, updateAccount, Account, AccountSnapshot, OpenPosition,
} from '@/lib/api';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { PositionCard } from '@/components/ui/PositionCard';
import { TradeModal }   from '@/components/TradeModal';
import { PauseCircle, PlayCircle, Trash2, Plus, X, ChevronRight, Pencil, RefreshCw } from 'lucide-react';
import { MANUAL_TRADE_BASES_UNIQUE, isStrategySymbol } from '@/lib/symbols';


export default function AccountsPage() {
  const [accounts, setAccounts]       = useState<Account[]>([]);
  const [selected, setSelected]       = useState<AccountSnapshot | null>(null);
  const [showAdd,  setShowAdd]        = useState(false);
  const [editAcc,  setEditAcc]        = useState<Account | null>(null);
  const [loading,  setLoading]        = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);
  const [actionId, setActionId]       = useState<string | null>(null);
  // account_id → {balance, daily_pnl} (live, polled with overview)
  const [balances, setBalances]       = useState<Record<string, number>>({});
  const [dailyPnls, setDailyPnls]     = useState<Record<string, number>>({});

  const reload = () => Promise.all([
    getAccounts().then(setAccounts),
    getOverview().then((o) => {
      const bals: Record<string, number> = {};
      const pnls: Record<string, number> = {};
      for (const a of o.accounts) {
        bals[a.account_id] = a.balance;
        pnls[a.account_id] = a.daily_pnl;
      }
      setBalances(bals);
      setDailyPnls(pnls);
    }).catch(() => {}),
  ]);
  useEffect(() => {
    reload();
    const t = setInterval(reload, 15_000);   // refresh balances every 15s
    return () => clearInterval(t);
  }, []);

  async function openDetail(id: string) {
    const snap = await getAccountSnap(id);
    setSelected(snap);
  }

  async function handlePause(id: string) {
    setActionId(id);
    try {
      await pauseAccount(id);
      reload();
    } catch (err: any) {
      alert(`Pause failed: ${err.message || err}`);
    } finally {
      setActionId(null);
    }
  }

  async function handleActivate(id: string) {
    setActionId(id);
    try {
      await activateAccount(id);
      reload();
    } catch (err: any) {
      alert(`Cannot activate this account.\n\n${err.message || err}\n\nFix the API key/secret via Edit and try again.`);
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account? This cannot be undone.')) return;
    await deleteAccount(id);
    reload();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans font-semibold text-2xl text-text">Accounts</h1>
          <p className="text-muted text-sm font-sans mt-1">{accounts.length} total accounts</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-green text-bg px-4 py-2 rounded-lg font-sans font-semibold text-sm
                     hover:bg-green/90 transition-colors duration-150 cursor-pointer"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>

      {/* ── Mobile: stacked cards (<md) ──────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {accounts.map((acc) => {
          const bal = balances[acc.id];
          return (
            <div
              key={acc.id}
              onClick={() => openDetail(acc.id)}
              className="bg-surface border border-border rounded-xl p-4 active:bg-elevated/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-text font-medium truncate">{acc.name}</p>
                  <p className="text-muted text-xs truncate">{acc.email}</p>
                </div>
                <Badge variant={acc.is_active ? 'active' : 'paused'}>
                  {acc.is_active ? 'Active' : 'Paused'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-border/40">
                <div>
                  <p className="text-muted text-[10px] uppercase tracking-wide mb-0.5">Balance</p>
                  <p className="font-mono font-semibold text-sm text-text">
                    {bal != null ? `$${bal.toFixed(2)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted text-[10px] uppercase tracking-wide mb-0.5">Exchange</p>
                  <p className="font-mono text-xs text-text uppercase">{acc.exchange}</p>
                </div>
                <div>
                  <p className="text-muted text-[10px] uppercase tracking-wide mb-0.5">Created</p>
                  <p className="text-muted text-[11px]">{fmtDate(acc.created_at)}</p>
                </div>
              </div>
              <div
                className="flex items-center gap-3 pt-2 border-t border-border/40"
                onClick={(e) => e.stopPropagation()}
              >
                {acc.is_active ? (
                  <button onClick={() => handlePause(acc.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans text-red border border-red/30 bg-red/5 hover:bg-red/10 active:scale-95 transition">
                    <PauseCircle size={12} /> Pause
                  </button>
                ) : (
                  <button onClick={() => handleActivate(acc.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans text-green border border-green/30 bg-green/5 hover:bg-green/10 active:scale-95 transition">
                    <PlayCircle size={12} /> Activate
                  </button>
                )}
                <button onClick={() => setEditAcc(acc)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans text-muted border border-border hover:text-text hover:border-text/30 active:scale-95 transition">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(acc.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans text-red/80 border border-red/20 hover:bg-red/10 active:scale-95 transition ml-auto">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {accounts.length === 0 && (
          <div className="bg-surface border border-border rounded-xl px-5 py-12 text-center text-muted text-sm">
            No accounts yet. Tap &ldquo;Add Account&rdquo; to start.
          </div>
        )}
      </div>

      {/* ── Desktop: table (≥md) ─────────────────────────────────────────── */}
      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border">
              {['Account', 'Exchange', 'Status', 'Balance', 'Daily P&L', 'Created', 'Actions'].map((h) => (
                <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => {
              const bal = balances[acc.id];
              return (
              <tr
                key={acc.id}
                className="border-b border-border/50 hover:bg-elevated/50 transition-colors duration-100 cursor-pointer"
                onClick={() => openDetail(acc.id)}
              >
                <td className="px-5 py-3.5">
                  <p className="text-text font-medium">{acc.name}</p>
                  <p className="text-muted text-xs">{acc.email}</p>
                </td>
                <td className="px-5 py-3.5 font-mono text-muted text-xs uppercase">{acc.exchange}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={acc.is_active ? 'active' : 'paused'}>
                    {acc.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 font-mono text-text">
                  {bal != null ? `$${bal.toFixed(2)}` : '—'}
                </td>
                <td className="px-5 py-3.5 font-mono">
                  {dailyPnls[acc.id] != null
                    ? <span className={dailyPnls[acc.id] >= 0 ? 'text-green' : 'text-red'}>{fmtPnl(dailyPnls[acc.id])}</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td className="px-5 py-3.5 text-muted text-xs">{fmtDate(acc.created_at)}</td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {actionId === acc.id ? (
                      <RefreshCw size={14} className="animate-spin text-muted" />
                    ) : acc.is_active ? (
                      <button onClick={() => handlePause(acc.id)} title="Pause"
                        className="text-muted hover:text-red transition-colors cursor-pointer">
                        <PauseCircle size={16} />
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(acc.id)} title="Activate"
                        className="text-muted hover:text-green transition-colors cursor-pointer">
                        <PlayCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => setEditAcc(acc)} title="Edit"
                      className="text-muted hover:text-green transition-colors cursor-pointer">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(acc.id)} title="Delete"
                      className="text-muted hover:text-red transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={14} className="text-muted/40 ml-1" />
                  </div>
                </td>
              </tr>
              );
            })}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted text-sm">
                  No accounts yet. Click &ldquo;Add Account&rdquo; to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Account detail drawer */}
      {selected && (
        <AccountDrawer
          snap={selected}
          exchange={accounts.find(a => a.id === selected.account_id)?.exchange || 'bingx'}
          onClose={() => setSelected(null)}
          onTrade={setTradeSymbol}
          onRefresh={() => getAccountSnap(selected.account_id).then(setSelected)}
        />
      )}

      {/* Add account modal */}
      {showAdd && (
        <AddAccountModal onClose={() => { setShowAdd(false); reload(); }} />
      )}

      {/* Edit account modal */}
      {editAcc && (
        <EditAccountModal account={editAcc} onClose={() => { setEditAcc(null); reload(); }} />
      )}

      {/* Trade modal */}
      {tradeSymbol && selected && (
        <TradeModal
          accountId={selected.account_id}
          symbol={tradeSymbol}
          exchange={accounts.find(a => a.id === selected.account_id)?.exchange || 'bingx'}
          canTrade={true}
          onClose={() => setTradeSymbol(null)}
          onDone={() => getAccountSnap(selected.account_id).then(setSelected)}
        />
      )}
    </div>
  );
}

// Manual trading from the account drawer — full catalogue (not just strategy 10).
const TRADE_SYMBOLS = MANUAL_TRADE_BASES_UNIQUE;

function AccountDrawer({ snap, exchange, onClose, onTrade, onRefresh }: {
  snap: AccountSnapshot;
  exchange: string;
  onClose: () => void;
  onTrade: (symbol: string) => void;
  onRefresh: () => void;
}) {
  const toSymbol = (base: string) =>
    exchange === 'hyperliquid' ? `${base}/USDC:USDC` : `${base}/USDT:USDT`;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full sm:w-96 bg-surface border-l border-border flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface">
          <div>
            <h2 className="text-text font-sans font-semibold">{snap.name}</h2>
            <p className="text-muted text-xs">{snap.email} · <span className="uppercase font-mono">{exchange}</span></p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Daily stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-elevated border border-border rounded-lg p-3">
              <p className="text-muted text-xs mb-1">Daily P&L</p>
              <p className={`font-mono font-semibold ${snap.daily_pnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtPnl(snap.daily_pnl)}
              </p>
            </div>
            <div className="bg-elevated border border-border rounded-lg p-3">
              <p className="text-muted text-xs mb-1">Daily Trades</p>
              <p className="font-mono font-semibold text-text">{snap.daily_trades}</p>
            </div>
          </div>

          {/* New trade — symbol picker (full catalogue, bot-active marked) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-muted text-xs font-medium uppercase tracking-wider">
                New Trade
              </h3>
              <p className="text-[10px] text-muted/70 font-sans">
                <span className="font-mono text-green">●</span> = bot is trading
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {TRADE_SYMBOLS.map(base => {
                const isBot = isStrategySymbol(base);
                return (
                  <button
                    key={base}
                    onClick={() => onTrade(toSymbol(base))}
                    title={isBot ? `${base} — bot is actively trading this` : `${base} — manual only`}
                    className={`relative py-2 rounded-lg text-xs font-mono font-semibold border
                               transition-colors cursor-pointer ${
                      isBot
                        ? 'bg-green/8 border-green/30 text-green hover:bg-green/15 hover:border-green/50'
                        : 'bg-elevated border-border text-muted hover:text-text hover:border-text/30'
                    }`}
                  >
                    {isBot && <span className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-green" />}
                    {base}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open positions */}
          <div>
            <h3 className="text-muted text-xs font-medium uppercase tracking-wider mb-3">
              Open Positions ({snap.open_count})
            </h3>
            {snap.open_positions.length > 0 ? (
              <div className="space-y-3">
                {snap.open_positions.map((p) => (
                  <PositionCard
                    key={p.symbol}
                    position={p}
                    accountId={snap.account_id}
                    onTrade={onTrade}
                    onClosed={onRefresh}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm py-4 text-center">No open positions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', api_key: '', api_secret: '',
    exchange: 'bingx', member_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res: any = await addAccount(form);
      // Backend now returns { account, verified, message, warning }.
      // If creds didn't pass live check, the account is created but paused.
      if (res && res.warning) {
        alert(res.warning);   // surface to admin so they re-enter keys
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-text font-sans font-semibold">Add Member Account</h2>
          <button onClick={onClose} className="text-muted hover:text-text cursor-pointer"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Member Name', key: 'name' as const, type: 'text', placeholder: 'John Doe' },
            { label: 'Email',       key: 'email' as const, type: 'email', placeholder: 'john@example.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-muted text-xs mb-1.5">{label}</label>
              <input
                type={type} placeholder={placeholder} {...field(key)}
                className="w-full bg-elevated border border-border rounded-lg px-3 py-2.5 text-text text-sm
                           placeholder:text-muted/40 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/20
                           transition-colors duration-150"
              />
            </div>
          ))}

          {/* Exchange selector */}
          <div>
            <label className="block text-muted text-xs mb-1.5">Exchange</label>
            <div className="flex gap-2">
              {(['bingx', 'hyperliquid'] as const).map(ex => (
                <button
                  key={ex} type="button"
                  onClick={() => setForm({ ...form, exchange: ex })}
                  className={`flex-1 py-2 rounded-lg text-sm font-sans transition-colors cursor-pointer border ${
                    form.exchange === ex
                      ? 'bg-green/10 border-green/50 text-green font-medium'
                      : 'bg-elevated border-border text-muted hover:text-text'
                  }`}
                >
                  {ex === 'bingx' ? 'BingX' : 'Hyperliquid'}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: `${form.exchange === 'hyperliquid' ? 'Wallet Address' : 'API Key'}`,    key: 'api_key' as const,    type: 'text',     placeholder: form.exchange === 'hyperliquid' ? '0x...' : 'API key' },
            { label: `${form.exchange === 'hyperliquid' ? 'Private Key'    : 'API Secret'}`, key: 'api_secret' as const, type: 'password', placeholder: form.exchange === 'hyperliquid' ? 'Private key' : 'API secret' },
            { label: 'Member Login Password (optional)', key: 'member_password' as const, type: 'password', placeholder: 'Dashboard login password' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-muted text-xs mb-1.5">{label}</label>
              <input
                type={type} placeholder={placeholder} {...field(key)}
                className="w-full bg-elevated border border-border rounded-lg px-3 py-2.5 text-text text-sm
                           placeholder:text-muted/40 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/20
                           transition-colors duration-150"
              />
            </div>
          ))}

          {error && <p className="text-red text-sm bg-red/5 border border-red/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-border text-muted py-2.5 rounded-lg font-sans text-sm hover:bg-elevated cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-green text-bg py-2.5 rounded-lg font-sans font-semibold text-sm hover:bg-green/90 disabled:opacity-50 cursor-pointer transition-colors">
              {loading ? 'Adding…' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAccountModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const [form, setForm] = useState({
    name: account.name,
    email: account.email,
    exchange: account.exchange,
    api_key: '',
    api_secret: '',
    member_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const body: Record<string, string> = { name: form.name, email: form.email, exchange: form.exchange };
      if (form.api_key)        body.api_key        = form.api_key;
      if (form.api_secret)     body.api_secret     = form.api_secret;
      if (form.member_password) body.member_password = form.member_password;
      await updateAccount(account.id, body);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inp = 'w-full bg-elevated border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/20 transition-colors duration-150';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-text font-sans font-semibold">Edit Account</h2>
          <button onClick={onClose} className="text-muted hover:text-text cursor-pointer"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-muted text-xs mb-1.5">Member Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inp} />
          </div>
          <div>
            <label className="block text-muted text-xs mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inp} />
          </div>

          <div>
            <label className="block text-muted text-xs mb-1.5">Exchange</label>
            <div className="flex gap-2">
              {(['bingx', 'hyperliquid'] as const).map(ex => (
                <button key={ex} type="button" onClick={() => setForm({...form, exchange: ex})}
                  className={`flex-1 py-2 rounded-lg text-sm font-sans transition-colors cursor-pointer border ${
                    form.exchange === ex ? 'bg-green/10 border-green/50 text-green font-medium' : 'bg-elevated border-border text-muted hover:text-text'
                  }`}>
                  {ex === 'bingx' ? 'BingX' : 'Hyperliquid'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-muted text-xs mb-1.5">
              {form.exchange === 'hyperliquid' ? 'Wallet Address' : 'API Key'} <span className="text-muted/50">(leave blank to keep current)</span>
            </label>
            <input type="text" value={form.api_key} onChange={e => setForm({...form, api_key: e.target.value})}
              placeholder="New key…" className={inp} />
          </div>
          <div>
            <label className="block text-muted text-xs mb-1.5">
              {form.exchange === 'hyperliquid' ? 'Private Key' : 'API Secret'} <span className="text-muted/50">(leave blank to keep current)</span>
            </label>
            <input type="password" value={form.api_secret} onChange={e => setForm({...form, api_secret: e.target.value})}
              placeholder="New secret…" className={inp} />
          </div>
          <div>
            <label className="block text-muted text-xs mb-1.5">Member Login Password <span className="text-muted/50">(leave blank to keep current)</span></label>
            <input type="password" value={form.member_password} onChange={e => setForm({...form, member_password: e.target.value})}
              placeholder="New password…" className={inp} />
          </div>

          {error && <p className="text-red text-sm bg-red/5 border border-red/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-border text-muted py-2.5 rounded-lg font-sans text-sm hover:bg-elevated cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-green text-bg py-2.5 rounded-lg font-sans font-semibold text-sm hover:bg-green/90 disabled:opacity-50 cursor-pointer transition-colors">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
