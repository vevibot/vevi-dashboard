import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * A control, not a coloured rectangle.
 *
 * Three things separate a modern button from a dated one, and none of them is the
 * colour: a small radius, a 1px inner highlight along the top edge so the face
 * reads as lit from above, and a hover that changes the border and lifts a soft
 * diffuse glow rather than just swapping a background.
 *
 * Brand never fills the face. A solid neon block beside a green P&L figure is what
 * made the old palette shout; the accent lives in the border, the label and the
 * glow instead.
 */
const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 rounded-md font-sans font-medium ' +
    'whitespace-nowrap select-none ' +
    // Named properties only — `transition: all` animates layout and janks.
    'transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out ' +
    'cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ' +
    'active:scale-[.98] motion-reduce:active:scale-100 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-bg',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-accent/[.18] to-accent/[.08] text-accent ' +
          'border border-accent/40 shadow-rim ' +
          '[@media(hover:hover)]:hover:border-accent/70 [@media(hover:hover)]:hover:shadow-glow ' +
          '[@media(hover:hover)]:hover:from-accent/25 [@media(hover:hover)]:hover:to-accent/[.12]',
        danger:
          'bg-gradient-to-b from-red/[.16] to-red/[.07] text-red border border-red/35 shadow-rim ' +
          '[@media(hover:hover)]:hover:border-red/65 [@media(hover:hover)]:hover:from-red/25',
        ghost:
          'bg-gradient-to-b from-float to-elevated text-secondary border border-border shadow-rim ' +
          '[@media(hover:hover)]:hover:text-text [@media(hover:hover)]:hover:border-border-lit',
      },
      size: {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3.5 py-2 text-sm',
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
