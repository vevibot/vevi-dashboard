'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  icon?: React.ReactNode;
}

/**
 * A cell on the status rail — not a card.
 *
 * This was the hero-metric template: a rounded box per figure, big number over
 * small label, four of them in a grid. That pattern is the reason the dashboard
 * read as generic; the boxes carried no information and the gaps between them
 * carried less. Here the figures sit in one continuous rail divided by hairlines,
 * which is how a terminal presents a status line.
 *
 * The API is unchanged so every existing caller keeps working.
 */
export function MetricCard({ label, value, sub, positive, icon }: Props) {
  const valueColor =
    positive === true  ? 'text-green' :
    positive === false ? 'text-red'   : 'text-text';

  // The one authored moment: when a figure changes, it marks itself and settles.
  // Direction comes from the numeric delta, so it says *which way* it moved.
  const prev = useRef<string | null>(null);
  const [mark, setMark] = useState<'' | 'mark-up' | 'mark-down'>('');
  useEffect(() => {
    if (prev.current !== null && prev.current !== value) {
      const n = (s: string) => parseFloat(s.replace(/[^0-9.-]/g, '')) || 0;
      setMark(n(value) >= n(prev.current) ? 'mark-up' : 'mark-down');
      const t = setTimeout(() => setMark(''), 900);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);

  return (
    <div className={cn('px-4 py-3 min-w-0', mark)}>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted shrink-0 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
        <span className="lbl truncate">{label}</span>
      </div>
      <div className={cn('num text-xl font-semibold mt-1.5 truncate', valueColor)}>{value}</div>
      {sub && <div className="text-muted text-xs mt-0.5 truncate">{sub}</div>}
    </div>
  );
}
