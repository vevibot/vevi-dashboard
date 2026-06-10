'use client';
import { useEffect, useState } from 'react';
import { getActivity } from '@/lib/api';

interface SymbolActivity {
  status: string;
  bias: number;
  detail: string;
  updated_at: string;
}

type ActivityData = Record<string, Record<string, SymbolActivity>>;

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  open_long:  { label: 'LONG',     color: 'text-green',  dot: 'bg-green' },
  open_short: { label: 'SHORT',    color: 'text-red',    dot: 'bg-red' },
  placing:    { label: 'PLACING',  color: 'text-yellow-400', dot: 'bg-yellow-400' },
  scanning:   { label: 'SCANNING', color: 'text-muted',  dot: 'bg-muted' },
  filtered:   { label: 'FILTERED', color: 'text-muted',  dot: 'bg-slate-600' },
  blocked:    { label: 'BLOCKED',  color: 'text-muted',  dot: 'bg-slate-700' },
  neutral:    { label: 'NEUTRAL',  color: 'text-muted',  dot: 'bg-slate-600' },
};

function symbolBase(sym: string) {
  return sym.split('/')[0];
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso + 'Z').getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function ActivityPage() {
  const [data, setData]     = useState<ActivityData>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = () =>
    getActivity()
      .then(d => { setData(d as ActivityData); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const accountIds = Object.keys(data);

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1,2].map(i => <div key={i} className="h-32 bg-surface rounded-xl animate-pulse" />)}
    </div>
  );

  if (!accountIds.length) return (
    <div className="p-8 flex items-center justify-center h-64">
      <p className="text-muted font-sans text-sm">No activity yet — bot is starting up or no active accounts</p>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-sans font-semibold text-2xl text-text">Activity</h1>
        <p className="text-muted text-sm font-sans mt-1">Live bot status per symbol — updates every 15s</p>
      </div>

      <div className="space-y-8">
        {accountIds.map(accountId => {
          const symbols = data[accountId] || {};
          const symKeys = Object.keys(symbols);
          const activeSelected = selected && symKeys.includes(selected) ? selected : symKeys[0] ?? null;

          return (
            <div key={accountId} className="bg-surface border border-border rounded-xl overflow-hidden">
              {/* Account header */}
              <div className="px-5 py-3 border-b border-border bg-elevated/30 flex items-center justify-between">
                <span className="text-text font-sans font-medium text-sm">{accountId.slice(0, 8)}…</span>
                <span className="text-xs text-muted font-mono">{symKeys.length} symbols</span>
              </div>

              {/* Symbol tabs */}
              <div className="flex gap-1 px-4 pt-4 flex-wrap">
                {symKeys.map(sym => {
                  const info = symbols[sym];
                  const cfg = STATUS_CONFIG[info.status] || STATUS_CONFIG.scanning;
                  const isActive = activeSelected === sym;
                  return (
                    <button
                      key={sym}
                      onClick={() => setSelected(sym)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold
                        transition-colors cursor-pointer border ${
                        isActive
                          ? 'bg-elevated border-border text-text'
                          : 'border-transparent text-muted hover:text-text hover:bg-elevated/50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${
                        info.status === 'open_long' || info.status === 'open_short' ? 'animate-pulse' : ''
                      }`} />
                      {symbolBase(sym)}
                    </button>
                  );
                })}
              </div>

              {/* Detail panel for selected symbol */}
              {activeSelected && symbols[activeSelected] && (() => {
                const info = symbols[activeSelected];
                const cfg = STATUS_CONFIG[info.status] || STATUS_CONFIG.scanning;
                return (
                  <div className="px-5 py-4 mt-2">
                    <div className="bg-elevated border border-border rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${
                            info.status === 'open_long' || info.status === 'open_short' ? 'animate-pulse' : ''
                          }`} />
                          <span className="font-mono font-semibold text-text">{symbolBase(activeSelected)}</span>
                          <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded ${cfg.color} bg-current/5`}>
                            {cfg.label}
                          </span>
                        </div>
                        <span className="text-xs text-muted font-sans">{timeAgo(info.updated_at)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted text-xs mb-1">Bias</p>
                          <p className={`font-mono font-semibold text-sm ${
                            info.bias > 0 ? 'text-green' : info.bias < 0 ? 'text-red' : 'text-muted'
                          }`}>
                            {info.bias > 0 ? '+' : ''}{info.bias.toFixed(2)}
                            <span className="text-muted font-normal ml-1 text-xs">
                              {info.bias > 0 ? 'LONG' : info.bias < 0 ? 'SHORT' : 'NEUTRAL'}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-muted text-xs mb-1">Detail</p>
                          <p className="text-text text-sm font-sans">{info.detail || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="h-4" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
