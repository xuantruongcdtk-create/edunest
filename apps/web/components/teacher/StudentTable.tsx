'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Badge } from '../primitives/Badge'
import { Skeleton } from '../primitives/Skeleton'
import { EmptyState } from '../primitives/EmptyState'

interface StudentRow {
  id:         string
  full_name:  string
  grade:      number
  avg_score:  number | null
  quiz_count: number
}

interface StudentTableProps extends HTMLAttributes<HTMLDivElement> {
  students: StudentRow[]
  loading?: boolean
}

export const StudentTable = forwardRef<HTMLDivElement, StudentTableProps>(
  ({ className, students, loading, ...props }, ref) => {
    if (loading) {
      return (
        <Card className={cn('p-6', className)}>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-semibold text-gray-800">Danh sách học sinh</h3>
        </div>

        {students.length === 0 ? (
          <EmptyState icon="👥" title="Chưa có học sinh" description="Thêm học sinh vào lớp để bắt đầu theo dõi" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Họ tên</th>
                  <th className="text-left px-6 py-3 font-medium">Lớp</th>
                  <th className="text-right px-6 py-3 font-medium">Điểm TB</th>
                  <th className="text-right px-6 py-3 font-medium">Quiz đã làm</th>
                  <th className="text-left px-6 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => {
                  const avg    = s.avg_score ?? 0
                  const status = avg >= 8 ? 'Giỏi' : avg >= 6.5 ? 'Khá' : avg >= 5 ? 'TB' : 'Yếu'
                  const sv     = avg >= 8 ? 'success' : avg >= 6.5 ? 'primary' : avg >= 5 ? 'warning' : 'danger'
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-gray-800">{s.full_name}</td>
                      <td className="px-6 py-3.5 text-gray-600">{s.grade}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums font-semibold">
                        {s.avg_score != null ? s.avg_score.toFixed(1) : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right text-gray-600">{s.quiz_count}</td>
                      <td className="px-6 py-3.5">
                        {s.avg_score != null && <Badge variant={sv as 'success'}>{status}</Badge>}
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
StudentTable.displayName = 'StudentTable'
