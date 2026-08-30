import { cn } from '@/lib/utils';

interface Props {
  variant: 'active' | 'paused' | 'long' | 'short' | 'neutral';
  children: React.ReactNode;
}

const styles: Record<Props['variant'], string> = {
  active:  'bg-green/10 text-green border border-green/30',
  paused:  'bg-elevated text-muted border border-border',
  long:    'bg-green/10 text-green border border-green/30',
  short:   'bg-red/10 text-red border border-red/30',
  neutral: 'bg-elevated text-muted border border-border',
};

export function Badge({ variant, children }: Props) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium tabular-nums', styles[variant])}>
      {children}
    </span>
  );
}
