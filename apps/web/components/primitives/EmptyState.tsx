'use client'
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon = '📭', title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}
      {...props}
    >
      <span className="text-4xl select-none">{icon}</span>
      <p className="font-display font-semibold text-gray-800">{title}</p>
      {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
      {action}
    </div>
  ),
)
EmptyState.displayName = 'EmptyState'
