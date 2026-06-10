'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { StatCard } from '../dashboard/StatCard'
import { Skeleton } from '../primitives/Skeleton'

interface SchoolKPI {
  total_students: number
  avg_score:      number
  total_classes:  number
  school_name:    string
}

interface SchoolKPIGridProps extends HTMLAttributes<HTMLDivElement> {
  kpi:      SchoolKPI | null
  loading?: boolean
}

export const SchoolKPIGrid = forwardRef<HTMLDivElement, SchoolKPIGridProps>(
  ({ className, kpi, loading, ...props }, ref) => {
    if (loading || !kpi) {
      return (
        <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-card" />)}
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)} {...props}>
        <StatCard
          label="Tổng học sinh"
          value={kpi.total_students}
          icon="👥"
          accent="primary"
        />
        <StatCard
          label="Điểm TB toàn trường"
          value={kpi.avg_score.toFixed(1)}
          unit="/10"
          icon="📊"
          accent="success"
        />
        <StatCard
          label="Số lớp học"
          value={kpi.total_classes}
          icon="🏫"
          accent="accent"
        />
        <StatCard
          label="Trường"
          value={kpi.school_name}
          icon="🏫"
          accent="primary"
        />
      </div>
    )
  },
)
SchoolKPIGrid.displayName = 'SchoolKPIGrid'
