'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'primary' && 'bg-primary/10 text-primary',
        variant === 'success' && 'bg-success/10 text-success',
        variant === 'warning' && 'bg-warning/10 text-warning',
        variant === 'danger'  && 'bg-danger/10 text-danger',
        variant === 'accent'  && 'bg-accent/10 text-accent',
        variant === 'neutral' && 'bg-gray-100 text-gray-600',
        className,
      )}
      {...props}
    />
  ),
)
Badge.displayName = 'Badge'
