/**
 * Build a tax-friendly CSV export for trade history.
 * Includes a summary header (totals, win rate, gross win, gross loss)
 * and per-trade rows. Triggers an in-browser download.
 */
import { Trade, ExTrade } from './api';

function fmt(n: number, d = 4) {
  return Number.isFinite(n) ? n.toFixed(d) : '';
}

function csvEscape(v: any): string {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadFile(name: string, body: string) {
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface ExportMeta {
  accountName: string;
  accountEmail: string;
  exporterRole: 'admin' | 'member';
}

// ── Trade History (from internal DB — has open + closed) ─────────────────────
export function exportTradesCSV(trades: Trade[], meta: ExportMeta) {
  const closed = trades.filter(t => !t.is_open && t.pnl != null);
  const wins   = closed.filter(t => (t.pnl ?? 0) > 0);
  const losses = closed.filter(t => (t.pnl ?? 0) <= 0);
  const grossWin  = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = losses.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const netPnl    = grossWin + grossLoss;
  const wr        = closed.length ? (wins.length / closed.length * 100) : 0;
  const pf        = grossLoss === 0 ? '∞' : (grossWin / Math.abs(grossLoss)).toFixed(2);

  const exportedAt = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + 'Z';

  const header = [
    '# Vevi Trading Bot — Trade History Export',
    `# Account:        ${meta.accountName} (${meta.accountEmail})`,
    `# Exported by:    ${meta.exporterRole}`,
    `# Export time:    ${new Date().toISOString()}`,
    '#',
    '# SUMMARY — for tax accounting',
    `# Total trades:       ${closed.length}`,
    `# Winning trades:     ${wins.length}`,
    `# Losing trades:      ${losses.length}`,
    `# Win rate:           ${wr.toFixed(1)}%`,
    `# Gross profit:       +$${grossWin.toFixed(4)}`,
    `# Gross loss:         $${grossLoss.toFixed(4)}`,
    `# NET REALIZED P&L:   ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(4)}`,
    `# Profit factor:      ${pf}`,
    '#',
    '',
  ].join('\n');

  const cols = [
    'opened_at', 'closed_at', 'symbol', 'side',
    'entry', 'exit_price', 'pnl_usdt', 'duration_minutes',
  ];

  const rows = closed.map(t => {
    const opened = t.opened_at ? new Date(t.opened_at) : null;
    const closedAt = t.closed_at ? new Date(t.closed_at) : null;
    const dur = (opened && closedAt) ? Math.round((closedAt.getTime() - opened.getTime()) / 60000) : '';
    return [
      t.opened_at ?? '',
      t.closed_at ?? '',
      t.symbol,
      t.side?.toUpperCase() ?? '',
      fmt(t.entry, 6),
      t.exit_price != null ? fmt(t.exit_price, 6) : '',
      fmt(t.pnl ?? 0, 4),
      dur,
    ].map(csvEscape).join(',');
  });

  const csv = header + cols.join(',') + '\n' + rows.join('\n') + '\n';
  const safeName = meta.accountName.replace(/[^a-z0-9-]+/gi, '_');
  downloadFile(`vevi-trades-${safeName}-${exportedAt}.csv`, csv);
}

// ── Position History (exchange-side trades — raw fills) ──────────────────────
export function exportExTradesCSV(trades: ExTrade[], meta: ExportMeta) {
  const exportedAt = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + 'Z';

  const header = [
    '# Vevi Trading Bot — Exchange Position History Export',
    `# Account:    ${meta.accountName} (${meta.accountEmail})`,
    `# Exported by: ${meta.exporterRole}`,
    `# Export time: ${new Date().toISOString()}`,
    `# Total fills: ${trades.length}`,
    '#',
    '',
  ].join('\n');

  const cols = ['timestamp', 'symbol', 'side', 'price', 'amount', 'cost_usdt', 'fee_usdt'];
  const rows = trades.map(t => [
    t.timestamp ? new Date(t.timestamp).toISOString() : '',
    t.symbol,
    t.side?.toUpperCase() ?? '',
    fmt(t.price, 6),
    fmt(t.amount, 6),
    fmt(t.cost, 4),
    t.fee ? fmt(t.fee.cost, 6) : '',
  ].map(csvEscape).join(','));

  const csv = header + cols.join(',') + '\n' + rows.join('\n') + '\n';
  const safeName = meta.accountName.replace(/[^a-z0-9-]+/gi, '_');
  downloadFile(`vevi-fills-${safeName}-${exportedAt}.csv`, csv);
}
