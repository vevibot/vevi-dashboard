'use client';
import { cn } from '@/lib/utils';

/**
 * The Vevi wordmark, as outlined paths.
 *
 * Taken from the brand export rather than set in a font: the letterforms are real
 * outlines, so the mark is identical at every size and on every machine, with no
 * webfont to load or fail. Colour is inherited from the two fills below, not from
 * currentColor, because the dot and the wordmark are deliberately different values.
 */
export function VeviWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 84.45 31.13" className={className} role="img" aria-label="Vevi">
      <g transform="translate(-1.28 -4.35)">
        <path
          d="M5.278 28.354Q5.278 27.5 5.698 26.793Q6.118 26.086 6.832 25.659Q7.546 25.232 8.4 25.232Q9.268 25.232 9.975 25.659Q10.682 26.086 11.102 26.793Q11.522 27.5 11.522 28.354Q11.522 29.194 11.102 29.908Q10.682 30.622 9.975 31.049Q9.268 31.476 8.4 31.476Q7.546 31.476 6.832 31.049Q6.118 30.622 5.698 29.908Q5.278 29.194 5.278 28.354Z"
          fill="#7BF5B8"
        />
        <path
          d="M33.988 16.132 29.032 31.0H23.824L18.812 16.132H23.586L26.484 27.612L29.508 16.132ZM40.096 24.854Q40.25 26.072 40.733 26.821Q41.216 27.57 41.972 27.913Q42.728 28.256 43.666 28.256Q44.688 28.256 45.64 27.92Q46.592 27.584 47.474 27.024L49.252 29.432Q48.202 30.328 46.711 30.902Q45.22 31.476 43.316 31.476Q40.768 31.476 39.046 30.461Q37.324 29.446 36.456 27.668Q35.588 25.89 35.588 23.58Q35.588 21.382 36.428 19.583Q37.268 17.784 38.885 16.713Q40.502 15.642 42.84 15.642Q44.968 15.642 46.529 16.552Q48.09 17.462 48.951 19.17Q49.812 20.878 49.812 23.272Q49.812 23.65 49.791 24.084Q49.77 24.518 49.728 24.854ZM42.84 18.61Q41.65 18.61 40.922 19.464Q40.194 20.318 40.04 22.194H45.5Q45.486 20.57 44.87 19.59Q44.254 18.61 42.84 18.61ZM66.588 16.132 61.632 31.0H56.424L51.412 16.132H56.186L59.084 27.612L62.108 16.132ZM77.946 16.132V27.976H81.726V31.0H69.308V27.976H73.522V19.156H69.448V16.132ZM75.272 8.348Q76.42 8.348 77.148 9.062Q77.876 9.776 77.876 10.84Q77.876 11.904 77.148 12.625Q76.42 13.346 75.272 13.346Q74.11 13.346 73.375 12.625Q72.64 11.904 72.64 10.84Q72.64 9.776 73.375 9.062Q74.11 8.348 75.272 8.348Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

/**
 * The brand header, built rather than screenshotted.
 *
 * THE AUTHORED MOMENT: a green light rises from behind the mark on arrival, the way
 * a sun crests a horizon. It runs once, on load, and it is the only thing on the
 * screen that moves — a sign-in page that animates in six places feels cheap, one
 * that resolves in a single gesture feels made.
 *
 * Built in CSS rather than JS so it runs off the main thread and cannot stutter while
 * the auth request is in flight. Under reduced motion every element is simply painted
 * in its final position: the light is still there, it just never travels.
 */
export function VeviMark({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  const badge = size === 'sm' ? 'w-14 h-14' : 'w-[72px] h-[72px]';
  const mark  = size === 'sm' ? 'w-7' : 'w-9';

  return (
    <div className={cn('relative overflow-hidden bg-float', className)}>
      {/* the light. Sits below the mark and rises into place. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full sunrise"
        style={{
          width: 420,
          height: 420,
          top: '-46%',
          background:
            'radial-gradient(circle, rgba(62,207,142,.30), rgba(62,207,142,.10) 45%, transparent 68%)',
        }}
      />
      {/* a faint measured grid, masked so it fades before the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',
          backgroundSize: '34px 34px',
          WebkitMaskImage: 'radial-gradient(300px 150px at 50% 0%, #000 18%, transparent 74%)',
          maskImage: 'radial-gradient(300px 150px at 50% 0%, #000 18%, transparent 74%)',
        }}
      />
      {/* the horizon the light rises over */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,#3ECF8E 24%,#3ECF8E 76%,transparent)' }}
      />

      <div className="relative flex flex-col items-center justify-center gap-3.5 py-9">
        <div
          className={cn(
            badge,
            'rounded-full flex items-center justify-center rise',
            'shadow-[0_0_0_1px_rgba(62,207,142,.28),0_14px_38px_-12px_rgba(62,207,142,.45)]',
          )}
          style={{ background: 'radial-gradient(circle at 38% 30%, #46A375, #2C6B4C 72%)' }}
        >
          <VeviWordmark className={cn(mark, 'h-auto')} />
        </div>
        <div className="rise rise-2 font-sans text-[11px] font-semibold uppercase tracking-[.24em] text-white">
          Algorithmic Trading System
        </div>
      </div>
    </div>
  );
}
