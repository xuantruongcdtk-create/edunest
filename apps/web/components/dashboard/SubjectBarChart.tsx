'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Skeleton } from '../primitives/Skeleton'
import type { SubjectScore } from '@edunest/types'

const SUBJECT_LABELS: Record<string, string> = {
  math:        'Toán',
  literature:  'Văn',
  english:     'Anh',
  physics:     'Lý',
  chemistry:   'Hóa',
  biology:     'Sinh',
  history:     'Sử',
  geography:   'Địa',
  civics:      'GDCD',
  informatics: 'Tin',
}

interface SubjectBarChartProps extends HTMLAttributes<HTMLDivElement> {
  scores:   SubjectScore[]
  loading?: boolean
}

export const SubjectBarChart = forwardRef<HTMLDivElement, SubjectBarChartProps>(
  ({ className, scores, loading, ...props }, ref) => {
    if (loading) {
      return (
        <Card className={cn('p-6', className)}>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
          </div>
        </Card>
      )
    }

    const maxScore = 10

    return (
      <Card ref={ref} className={cn('p-6', className)} {...props}>
        <h3 className="font-display font-semibold text-gray-800 mb-4">Điểm theo môn học</h3>
        {scores.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có dữ liệu điểm</p>
        ) : (
          <div className="space-y-2.5">
            {scores.map((s) => {
              const pct   = (s.average / maxScore) * 100
              const color = s.average >= 8 ? 'bg-success' : s.average >= 6.5 ? 'bg-primary' : s.average >= 5 ? 'bg-warning' : 'bg-danger'
              return (
                <div key={s.subject}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium">{SUBJECT_LABELS[s.subject] ?? s.subject}</span>
                    <span className="font-semibold tabular-nums">
                      {s.average.toFixed(1)}
                      {s.trend !== 0 && (
                        <span className={cn('ml-1.5', s.trend > 0 ? 'text-success' : 'text-danger')}>
                          {s.trend > 0 ? '▲' : '▼'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    )
  },
)
SubjectBarChart.displayName = 'SubjectBarChart'
