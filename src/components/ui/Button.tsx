import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Semantic button primitive.
// - primary → BRAND accent (green stays reserved for P&L / long)
// - danger  → red (destructive: close, delete)
// - ghost   → low-emphasis, border-only
//
// Brand never fills a large surface: primary is a tinted face with a lit border and
// a glow on hover, not a solid block of neon. A solid accent fill next to a green
// P&L figure is what made the old palette shout.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-sans font-semibold whitespace-nowrap ' +
    // Name the properties. `transition: all` animates layout too, which janks.
    'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out ' +
    'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ' +
    // Press feedback — instant confirmation the interface heard you.
    'active:scale-[.97] motion-reduce:active:scale-100 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/45',
  {
    variants: {
      variant: {
        primary:
          'bg-accent/12 text-accent border border-accent/45 ' +
          'hover:border-accent hover:shadow-glow',
        danger:
          'bg-red/12 text-red border border-red/40 hover:border-red/70 hover:bg-red/20',
        ghost:
          'bg-white/[.03] text-secondary border border-border ' +
          'hover:text-text hover:border-white/20',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
