'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Badge } from '../primitives/Badge'
import { Skeleton } from '../primitives/Skeleton'
import { EmptyState } from '../primitives/EmptyState'

interface Alert {
  id:       string
  type:     string
  severity: 'info' | 'warning' | 'danger'
  title:    string
  body:     string
  is_read:  boolean
  created_at: string
}

interface AlertListProps extends HTMLAttributes<HTMLDivElement> {
  alerts:   Alert[]
  loading?: boolean
}

const SEVERITY_VARIANT = {
  info:    'primary',
  warning: 'warning',
  danger:  'danger',
} as const

const SEVERITY_ICON = { info: 'ℹ', warning: '⚠', danger: '🚨' }

export const AlertList = forwardRef<HTMLDivElement, AlertListProps>(
  ({ className, alerts, loading, ...props }, ref) => {
    if (loading) {
      return (
        <Card className={cn('p-6', className)}>
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn('p-6', className)} {...props}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-gray-800">Cảnh báo</h3>
          {alerts.filter((a) => !a.is_read).length > 0 && (
            <Badge variant="danger">{alerts.filter((a) => !a.is_read).length} mới</Badge>
          )}
        </div>

        {alerts.length === 0 ? (
          <EmptyState icon="✅" title="Không có cảnh báo" description="Mọi thứ đang ổn định" />
        ) : (
          <ul className="space-y-2.5">
            {alerts.slice(0, 5).map((alert) => (
              <li
                key={alert.id}
                className={cn(
                  'flex gap-3 p-3 rounded-lg border text-sm transition-colors',
                  alert.is_read ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200',
                )}
              >
                <span className="text-lg mt-0.5">{SEVERITY_ICON[alert.severity]}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('font-medium text-gray-800 truncate', !alert.is_read && 'font-semibold')}>
                      {alert.title}
                    </p>
                    <Badge variant={SEVERITY_VARIANT[alert.severity]}>{alert.severity}</Badge>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{alert.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    )
  },
)
AlertList.displayName = 'AlertList'
