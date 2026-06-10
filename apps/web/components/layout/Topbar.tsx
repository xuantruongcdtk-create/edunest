'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface TopbarProps extends HTMLAttributes<HTMLElement> {
  title: string
  actions?: React.ReactNode
}

export const Topbar = forwardRef<HTMLElement, TopbarProps>(
  ({ className, title, actions, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        'sticky top-0 z-10 flex h-14 items-center justify-between bg-white/80 backdrop-blur-sm',
        'border-b border-gray-100 px-6',
        className,
      )}
      {...props}
    >
      <h1 className="font-display font-bold text-lg text-gray-900">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  ),
)
Topbar.displayName = 'Topbar'
