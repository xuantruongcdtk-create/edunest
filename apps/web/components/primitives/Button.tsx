'use client'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-btn',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary'   && 'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary',
        variant === 'secondary' && 'bg-accent text-white hover:bg-accent-dark focus-visible:ring-accent',
        variant === 'ghost'     && 'bg-transparent hover:bg-gray-100 text-gray-700',
        variant === 'danger'    && 'bg-danger text-white hover:bg-danger-dark focus-visible:ring-danger',
        variant === 'outline'   && 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
        size === 'sm' && 'text-xs px-3 py-1.5',
        size === 'md' && 'text-sm px-4 py-2',
        size === 'lg' && 'text-base px-6 py-3',
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
