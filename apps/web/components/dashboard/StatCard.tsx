'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Skeleton } from '../primitives/Skeleton'

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label:     string
  value:     string | number
  unit?:     string
  icon?:     string
  trend?:    number        // positive = up, negative = down
  loading?:  boolean
  accent?:   'primary' | 'success' | 'warning' | 'danger' | 'accent'
}

const ACCENT_MAP = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger:  'bg-danger/10 text-danger',
  accent:  'bg-accent/10 text-accent',
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, unit, icon, trend, loading, accent = 'primary', ...props }, ref) => {
    if (loading) {
      return (
        <Card className={cn('p-5', className)}>
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16" />
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn('p-5 hover:shadow-card-hover transition-shadow', className)} {...props}>
        <div className="flex items-start justify-between">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          {icon && (
            <span className={cn('text-xl p-2 rounded-lg', ACCENT_MAP[accent])}>{icon}</span>
          )}
        </div>
        <div className="mt-2 flex items-end gap-1">
          <span className="font-display font-bold text-2xl text-gray-900 animate-count-up">
            {value}
          </span>
          {unit && <span className="text-sm text-gray-500 mb-0.5">{unit}</span>}
        </div>
        {trend !== undefined && (
          <p className={cn('text-xs mt-1 font-medium', trend >= 0 ? 'text-success' : 'text-danger')}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% so với tuần trước
          </p>
        )}
      </Card>
    )
  },
)
StatCard.displayName = 'StatCard'
