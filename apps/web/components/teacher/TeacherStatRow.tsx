'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { StatCard } from '../dashboard/StatCard'

interface TeacherStats {
  totalStudents: number
  totalClasses:  number
  avgScore:      number
  quizRate:      number
}

interface TeacherStatRowProps extends HTMLAttributes<HTMLDivElement> {
  stats:    TeacherStats
  loading?: boolean
}

export const TeacherStatRow = forwardRef<HTMLDivElement, TeacherStatRowProps>(
  ({ className, stats, loading, ...props }, ref) => (
    <div ref={ref} className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)} {...props}>
      <StatCard label="Tổng học sinh" value={stats.totalStudents} icon="👥" loading={loading} />
      <StatCard label="Số lớp"        value={stats.totalClasses}  icon="🏫" loading={loading} accent="accent" />
      <StatCard label="Điểm TB lớp"   value={stats.avgScore.toFixed(1)} unit="/10" icon="📊" loading={loading} accent="success" />
      <StatCard label="Hoàn thành quiz" value={`${stats.quizRate.toFixed(0)}%`} icon="📝" loading={loading} accent="warning" />
    </div>
  ),
)
TeacherStatRow.displayName = 'TeacherStatRow'
