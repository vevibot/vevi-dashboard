'use client';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, sub, positive, icon }: Props) {
  const valueColor =
    positive === true  ? 'text-green' :
    positive === false ? 'text-red'   : 'text-text';

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-text/20 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <span className="text-muted text-[11px] font-sans uppercase tracking-wider">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <span className={cn('font-mono text-2xl font-semibold leading-tight', valueColor)}>{value}</span>
      {sub && <span className="text-muted text-xs font-sans">{sub}</span>}
    </div>
  );
}
