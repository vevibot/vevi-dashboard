'use client';
import { useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A soft light that follows the pointer across a region.
 *
 * Sets --mx/--my on the element and lets CSS draw the gradient, so the work
 * happens on the compositor rather than in React state — a re-render per
 * mousemove would drop frames on a page already polling every 15s.
 *
 * Touch devices never fire pointermove without contact, and the CSS gates the
 * effect behind (hover: hover), so it costs nothing where it cannot be seen.
 */
export function Spotlight({
  children,
  className,
}: { children: ReactNode; className?: string }) {
  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);

  return (
    <div className={cn('spot', className)} onPointerMove={onMove}>
      {children}
    </div>
  );
}
