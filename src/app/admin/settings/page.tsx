'use client';
import { Lock, TrendingUp, Filter, Coins, Shield, Clock, AlertTriangle } from 'lucide-react';

/**
 * Live config snapshot — these values mirror config.py on the VPS.
 * Updates require: edit config.py locally → scp → restart vevi_bot service.
 * Web-based editing TBD (would require backend write endpoint + auth gate).
 */
const STRATEGY_CONFIG = {
  symbols: ['SUI', 'HYPE', 'TIA', 'NEAR', 'OP', 'JTO', 'SEI', 'STRK', 'FET', 'APT'],
  removed: [
    { s: 'XRP',  reason: 'PF 0.57 backtest — structural loser, dropped 2026-06-15' },
    { s: 'LINK', reason: 'PF 1.81 — only sub-PF-2.0 of original 6, dropped Phase 1C' },
  ],
  smartExit: {
    enabled: true,
    triggerR: 0.5,
    tightenMult: 0.5,
    deployedAt: '2026-06-15 11:46 UTC',
  },
  trail: { mult: 5.0, maxHoldBars: 2016 },
  risk: { perTrade: 14, leverage: 20, dailyLossLimitPct: 10, dailyLossLimitMin: 1, fallbackTradeUSDT: 5 },
  filters: {
    blockHours: [11, 12, 13, 18, 21],
    rsi: { enabled: true, longMin: 50, shortMax: 50, period: 14 },
    minConfidence: 5,
    fvgBackedSweep: true,
    fvgBackedProximity: 0.008,
    structExhaustion: true,
    structExhaustionLimit: 3,
  },
};

export default function SettingsPage() {
  const c = STRATEGY_CONFIG;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-sans font-semibold text-2xl text-text">Strategy Settings</h1>
          <p className="text-muted text-sm font-sans mt-1">Live config snapshot — read-only</p>
        </div>
        <div className="flex items-center gap-2 bg-elevated border border-border rounded-lg px-3 py-2">
          <Lock size={12} className="text-muted" />
          <span className="text-muted text-[11px] font-mono">edit via config.py + redeploy</span>
        </div>
      </div>

      {/* Smart Exit banner — the headline change */}
      <div className="bg-gradient-to-br from-green/10 to-green/0 border border-green/30 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] text-green font-mono font-bold tracking-wider mb-1">
              ◢ NEW · DEPLOYED {c.smartExit.deployedAt}
            </p>
            <h3 className="text-text font-sans font-semibold text-lg">Tighten-on-CHoCH Smart Exit</h3>
            <p className="text-muted text-sm font-sans mt-1.5">
              When peak profit reaches +{c.smartExit.triggerR}R and a CHoCH against position is detected,
              trail tightens from 5R → {c.smartExit.tightenMult}R behind peak.
            </p>
          </div>
          <span className="font-mono text-[10px] font-bold bg-green/15 text-green border border-green/40 rounded px-2.5 py-1">
            ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active symbols */}
        <Section icon={<Coins size={14} />} title="Active Symbols">
          <div className="flex flex-wrap gap-2 mb-4">
            {c.symbols.map(s => (
              <span key={s} className="font-mono text-xs font-semibold bg-green/10 text-green border border-green/30 px-2.5 py-1 rounded">
                {s}
              </span>
            ))}
          </div>
          {c.removed.length > 0 && (
            <div className="pt-3 border-t border-border/40">
              <p className="text-muted text-[10px] uppercase tracking-wider mb-2">Recently dropped</p>
              {c.removed.map(r => (
                <div key={r.s} className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs bg-red/5 text-red/80 border border-red/20 px-2 py-0.5 rounded line-through">{r.s}</span>
                  <span className="text-muted text-[11px] font-sans">{r.reason}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Risk & Position Sizing */}
        <Section icon={<Shield size={14} />} title="Risk & Position Sizing">
          <Row label="Per-trade risk" value={`${c.risk.perTrade}%`} sub="of account balance, dynamic" />
          <Row label="Leverage" value={`${c.risk.leverage}x`} sub="all symbols" />
          <Row label="Daily loss limit" value={`${c.risk.dailyLossLimitPct}%`} sub={`of balance, min $${c.risk.dailyLossLimitMin} — bot stops opening new trades`} />
          <Row label="Initial trail" value={`${c.trail.mult}R`} sub="before CHoCH tighten" />
          <Row label="Max hold" value={`${c.trail.maxHoldBars} bars`} sub="≈ 7 days on 5M" />
          <Row label="Fallback size" value={`$${c.risk.fallbackTradeUSDT}`} sub="if balance fetch fails" />
        </Section>

        {/* Smart Exit details */}
        <Section icon={<TrendingUp size={14} />} title="Smart Exit (Tighten on CHoCH)">
          <Row label="Enabled" value={c.smartExit.enabled ? 'YES' : 'NO'} color={c.smartExit.enabled ? 'text-green' : 'text-muted'} />
          <Row label="Profit trigger" value={`peak ≥ +${c.smartExit.triggerR}R`} sub="when CHoCH check fires" />
          <Row label="New trail distance" value={`${c.smartExit.tightenMult}R`} sub="behind peak after tighten" />
          <Row label="Fires per trade" value="Once (idempotent)" sub="trail_tightened flag" />
          <Row label="Backtest result" value="PF 1.88 → 2.91" sub="40d, 6 symbols, +927% compound from $22" color="text-green" />
        </Section>

        {/* Entry filters */}
        <Section icon={<Filter size={14} />} title="Entry Filters">
          <Row label="Block hours (UTC)" value={c.filters.blockHours.join(', ')} sub="bot skips these hours" />
          <Row
            label="RSI direction filter"
            value={c.filters.rsi.enabled ? 'ON' : 'OFF'}
            sub={`Long: RSI>${c.filters.rsi.longMin} · Short: RSI<${c.filters.rsi.shortMax}`}
            color={c.filters.rsi.enabled ? 'text-green' : 'text-muted'}
          />
          <Row label="Min confidence" value={`≥ ${c.filters.minConfidence}`} sub="signal confluence score" />
          <Row
            label="FVG-backed sweep"
            value={c.filters.fvgBackedSweep ? 'REQUIRED' : 'optional'}
            sub={`proximity ${(c.filters.fvgBackedProximity * 100).toFixed(2)}%`}
            color={c.filters.fvgBackedSweep ? 'text-green' : 'text-muted'}
          />
          <Row
            label="Struct exhaustion"
            value={c.filters.structExhaustion ? 'ON' : 'OFF'}
            sub={`penalize ${c.filters.structExhaustionLimit}+ consec same-direction signals`}
            color={c.filters.structExhaustion ? 'text-green' : 'text-muted'}
          />
        </Section>
      </div>

      {/* Footer warning */}
      <div className="mt-6 bg-elevated border border-border/50 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle size={14} className="text-muted mt-0.5 shrink-0" />
        <div>
          <p className="text-text text-xs font-sans font-medium mb-1">Config changes require redeploy</p>
          <p className="text-muted text-[11px] font-sans">
            Edit <span className="font-mono text-text">config.py</span> on this machine, scp to VPS,
            then <span className="font-mono text-text">sudo systemctl restart vevi_bot</span>.
            Phase 2: web-based config editing.
          </p>
        </div>
        <Clock size={14} className="text-muted mt-0.5 shrink-0 ml-auto" />
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-green">{icon}</span>
        <h3 className="text-text font-sans font-semibold text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/30 last:border-b-0">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-text/80 text-xs font-sans">{label}</p>
        {sub && <p className="text-muted/70 text-[10px] font-sans mt-0.5">{sub}</p>}
      </div>
      <span className={`font-mono text-sm font-semibold shrink-0 ${color || 'text-text'}`}>{value}</span>
    </div>
  );
}
