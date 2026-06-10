'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { StatCard } from '../dashboard/StatCard'

interface AdminStats {
  totalUsers:    number
  totalParents:  number
  totalTeachers: number
  totalSchools:  number
}

interface AdminStatRowProps extends HTMLAttributes<HTMLDivElement> {
  stats:    AdminStats
  loading?: boolean
}

export const AdminStatRow = forwardRef<HTMLDivElement, AdminStatRowProps>(
  ({ className, stats, loading, ...props }, ref) => (
    <div ref={ref} className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)} {...props}>
      <StatCard label="Tổng người dùng" value={stats.totalUsers}    icon="👥" loading={loading} />
      <StatCard label="Phụ huynh"       value={stats.totalParents}  icon="👨‍👩‍👧" loading={loading} accent="success" />
      <StatCard label="Giáo viên"       value={stats.totalTeachers} icon="👩‍🏫" loading={loading} accent="accent" />
      <StatCard label="Trường học"      value={stats.totalSchools}  icon="🏫" loading={loading} accent="warning" />
    </div>
  ),
)
AdminStatRow.displayName = 'AdminStatRow'
