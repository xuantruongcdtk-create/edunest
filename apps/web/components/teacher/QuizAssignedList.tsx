'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Badge } from '../primitives/Badge'
import { EmptyState } from '../primitives/EmptyState'
import { Skeleton } from '../primitives/Skeleton'

interface QuizItem {
  id:         string
  title:      string
  subject:    string
  difficulty: string
  status:     string
  question_count: number
  due_date:   string | null
}

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Toán', literature: 'Văn', english: 'Anh', physics: 'Lý',
  chemistry: 'Hóa', biology: 'Sinh', history: 'Sử', geography: 'Địa',
}
const DIFF_VARIANT = { easy: 'success', medium: 'warning', hard: 'danger' } as const
const STATUS_VARIANT = { draft: 'neutral', published: 'primary', archived: 'neutral' } as const

interface QuizAssignedListProps extends HTMLAttributes<HTMLDivElement> {
  quizzes:  QuizItem[]
  loading?: boolean
}

export const QuizAssignedList = forwardRef<HTMLDivElement, QuizAssignedListProps>(
  ({ className, quizzes, loading, ...props }, ref) => {
    if (loading) {
      return (
        <Card className={cn('p-6', className)}>
          <Skeleton className="h-5 w-32 mb-4" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full mb-2" />)}
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn('p-6', className)} {...props}>
        <h3 className="font-display font-semibold text-gray-800 mb-4">Bài kiểm tra</h3>

        {quizzes.length === 0 ? (
          <EmptyState icon="📝" title="Chưa có bài kiểm tra" description="Tạo bài kiểm tra AI cho học sinh" />
        ) : (
          <ul className="space-y-2.5">
            {quizzes.slice(0, 6).map((q) => (
              <li key={q.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {q.question_count}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{q.title}</p>
                  <p className="text-xs text-gray-500">{SUBJECT_LABELS[q.subject] ?? q.subject}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Badge variant={DIFF_VARIANT[q.difficulty as keyof typeof DIFF_VARIANT] ?? 'neutral'}>
                    {q.difficulty}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[q.status as keyof typeof STATUS_VARIANT] ?? 'neutral'}>
                    {q.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    )
  },
)
QuizAssignedList.displayName = 'QuizAssignedList'
