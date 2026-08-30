'use client';

/**
 * The terminal at rest.
 *
 * An empty state on an instrument is not an apology — it is the instrument showing
 * a flat trace, the way an oscilloscope with no signal still draws its baseline.
 * So: a hairline with a dim pip resting on it, the name of what will appear here,
 * and the true reason it is empty right now.
 *
 * `waiting` breathes the pip. Use it when the emptiness is temporary by design
 * (execution paused, scanning) rather than the result of a filter.
 */
export function Empty({
  title,
  detail,
  waiting = false,
  compact = false,
}: {
  title: string;
  detail?: string;
  waiting?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 ${compact ? 'py-6' : 'py-12'}`}>
      <div className="flex items-center w-full max-w-[240px]" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border-lit" />
        <span
          className={`mx-3 w-1.5 h-1.5 rounded-full ${waiting ? 'bg-accent/70 animate-pulse-slow' : 'bg-border-lit'}`}
        />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border-lit" />
      </div>
      <p className={`text-secondary text-sm font-sans ${compact ? 'mt-3' : 'mt-4'}`}>{title}</p>
      {detail && (
        <p className="text-muted text-xs font-sans mt-1 max-w-[42ch] leading-relaxed">{detail}</p>
      )}
    </div>
  );
}

/**
 * A chart with nothing to draw yet still draws its frame — baseline, faint grid,
 * a flat trace at zero. The instrument exists before the first measurement.
 */
export function EmptyChart({ height = 176, label }: { height?: number; label: string }) {
  return (
    <div className="relative" style={{ height }} role="img" aria-label={label}>
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-soft)" strokeWidth="0.4" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border)" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-soft)" strokeWidth="0.4" />
        {/* the flat trace, resting on the midline */}
        <line
          x1="0" y1="50" x2="100" y2="50"
          stroke="rgba(62,207,142,.35)" strokeWidth="0.8"
          strokeDasharray="2.5 2"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="lbl bg-surface/80 px-2.5 py-1 rounded-sm">{label}</span>
      </div>
    </div>
  );
}
