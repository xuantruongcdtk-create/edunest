'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Badge } from '../primitives/Badge'
import { EmptyState } from '../primitives/EmptyState'

interface ClassRank {
  id:            string
  name:          string
  student_count: number
  avg_score?:    number
}

interface ClassRankTableProps extends HTMLAttributes<HTMLDivElement> {
  classes: ClassRank[]
}

export const ClassRankTable = forwardRef<HTMLDivElement, ClassRankTableProps>(
  ({ className, classes, ...props }, ref) => {
    const sorted = [...classes].sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0))

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-semibold text-gray-800">Xếp hạng lớp học</h3>
        </div>
        {sorted.length === 0 ? (
          <EmptyState icon="🏫" title="Chưa có dữ liệu lớp học" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3 font-medium w-12">#</th>
                  <th className="text-left px-6 py-3 font-medium">Lớp</th>
                  <th className="text-right px-6 py-3 font-medium">Sĩ số</th>
                  <th className="text-right px-6 py-3 font-medium">Điểm TB</th>
                  <th className="text-left px-6 py-3 font-medium">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((cls, i) => {
                  const avg = cls.avg_score ?? 0
                  const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
                  const grade = avg >= 8 ? 'Xuất sắc' : avg >= 6.5 ? 'Khá' : avg >= 5 ? 'TB' : 'Yếu'
                  const gv = avg >= 8 ? 'success' : avg >= 6.5 ? 'primary' : avg >= 5 ? 'warning' : 'danger'
                  return (
                    <tr key={cls.id} className={cn('hover:bg-gray-50', i < 3 && 'bg-yellow-50/40')}>
                      <td className="px-6 py-3 text-center">{rank}</td>
                      <td className="px-6 py-3 font-semibold text-gray-800">{cls.name}</td>
                      <td className="px-6 py-3 text-right text-gray-600">{cls.student_count}</td>
                      <td className="px-6 py-3 text-right font-bold tabular-nums">
                        {cls.avg_score != null ? cls.avg_score.toFixed(1) : '—'}
                      </td>
                      <td className="px-6 py-3">
                        {cls.avg_score != null && <Badge variant={gv as 'success'}>{grade}</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    )
  },
)
ClassRankTable.displayName = 'ClassRankTable'
