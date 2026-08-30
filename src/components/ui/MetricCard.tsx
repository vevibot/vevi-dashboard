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
    <div
      className={cn(
        // A gradient face rather than a flat fill, so the card reads as lit from above.
        'bg-gradient-to-b from-elevated to-surface border border-border rounded-lg p-5',
        'flex flex-col gap-2 rim',
        // Named properties only, and hover gated: touch devices fire :hover on tap
        // and it then sticks until the next tap elsewhere.
        'transition-[border-color,transform,box-shadow] duration-200 ease-out',
        '[@media(hover:hover)and(pointer:fine)]:hover:border-accent/35',
        '[@media(hover:hover)and(pointer:fine)]:hover:-translate-y-0.5',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted text-[10px] font-mono font-semibold uppercase tracking-[.14em]">
          {label}
        </span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <span
        className={cn(
          'font-mono num text-xl md:text-2xl font-semibold leading-tight break-all tracking-tight',
          valueColor,
        )}
      >
        {value}
      </span>
      {sub && <span className="text-muted text-xs font-sans">{sub}</span>}
    </div>
  );
}
