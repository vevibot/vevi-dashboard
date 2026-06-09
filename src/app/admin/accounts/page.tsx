'use client';
import { useEffect, useState } from 'react';
import {
  getAccounts, getAccountSnap, pauseAccount, activateAccount, deleteAccount,
  addAccount, Account, AccountSnapshot, OpenPosition,
} from '@/lib/api';
import { fmtPnl, fmtPrice, fmtDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { PositionCard } from '@/components/ui/PositionCard';
import { TradeModal }   from '@/components/TradeModal';
import { PauseCircle, PlayCircle, Trash2, Plus, X, ChevronRight } from 'lucide-react';

function exchangeFromSymbol(sym: string): string {
  return sym.includes('USDC') ? 'hyperliquid' : 'bingx';
}

export default function AccountsPage() {
  const [accounts, setAccounts]       = useState<Account[]>([]);
  const [selected, setSelected]       = useState<AccountSnapshot | null>(null);
  const [showAdd,  setShowAdd]        = useState(false);
  const [loading,  setLoading]        = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);

  const reload = () => getAccounts().then(setAccounts);
  useEffect(() => { reload(); }, []);

  async function openDetail(id: string) {
    const snap = await getAccountSnap(id);
    setSelected(snap);
  }

  async function handlePause(id: string) {
    await pauseAccount(id);
    reload();
  }

  async function handleActivate(id: string) {
    await activateAccount(id);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account? This cannot be undone.')) return;
    await deleteAccount(id);
    reload();
  }

  return (
    <div className="p-8">
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

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border">
              {['Account', 'Exchange', 'Status', 'Daily P&L', 'Open Pos', 'Created', 'Actions'].map((h) => (
                <th key={h} className="text-left text-muted text-xs font-medium px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
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
                <td className="px-5 py-3.5 font-mono text-muted">—</td>
                <td className="px-5 py-3.5 font-mono text-muted">—</td>
                <td className="px-5 py-3.5 text-muted text-xs">{fmtDate(acc.created_at)}</td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {acc.is_active ? (
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
                    <button onClick={() => handleDelete(acc.id)} title="Delete"
                      className="text-muted hover:text-red transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={14} className="text-muted/40 ml-1" />
                  </div>
                </td>
              </tr>
            ))}
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
        <AccountDrawer snap={selected} onClose={() => setSelected(null)} />
      )}

      {/* Add account modal */}
      {showAdd && (
        <AddAccountModal onClose={() => { setShowAdd(false); reload(); }} />
      )}
    </div>
  );
}

function AccountDrawer({ snap, onClose }: { snap: AccountSnapshot; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
      <div className="w-96 bg-surface border-l border-border flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface">
          <div>
            <h2 className="text-text font-sans font-semibold">{snap.name}</h2>
            <p className="text-muted text-xs">{snap.email}</p>
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

          {/* Open positions */}
          <div>
            <h3 className="text-muted text-xs font-medium uppercase tracking-wider mb-3">
              Open Positions ({snap.open_count})
            </h3>
            {snap.open_positions.length > 0 ? (
              <div className="space-y-3">
                {snap.open_positions.map((p) => (
                  <PositionCard key={p.symbol} position={p} onTrade={setTradeSymbol} />
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm py-4 text-center">No open positions</p>
            )}
          </div>
        </div>
      </div>

      {tradeSymbol && selected && (
        <TradeModal
          accountId={selected.account_id}
          symbol={tradeSymbol}
          exchange={exchangeFromSymbol(tradeSymbol)}
          canTrade={true}
          onClose={() => setTradeSymbol(null)}
          onDone={() => getAccountSnap(selected.account_id).then(setSelected)}
        />
      )}
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
      await addAccount(form);
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
