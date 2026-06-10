'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Badge } from '../primitives/Badge'
import { Skeleton } from '../primitives/Skeleton'
import type { LearningDNA } from '@edunest/types'

const STYLE_LABELS: Record<string, string> = {
  visual:      'Thị giác',
  auditory:    'Thính giác',
  reading:     'Đọc/Viết',
  kinesthetic: 'Vận động',
}
const RISK_LABELS: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }
const RISK_VARIANT = {
  low:    'success',
  medium: 'warning',
  high:   'danger',
} as const

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Toán', literature: 'Văn', english: 'Anh', physics: 'Lý',
  chemistry: 'Hóa', biology: 'Sinh', history: 'Sử', geography: 'Địa',
  civics: 'GDCD', informatics: 'Tin',
}

interface LearningDNACardProps extends HTMLAttributes<HTMLDivElement> {
  dna:      LearningDNA | null
  loading?: boolean
}

export const LearningDNACard = forwardRef<HTMLDivElement, LearningDNACardProps>(
  ({ className, dna, loading, ...props }, ref) => {
    if (loading) {
      return (
        <Card className={cn('p-6', className)}>
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </Card>
      )
    }

    if (!dna) return null

    return (
      <Card ref={ref} className={cn('p-6', className)} {...props}>
        <h3 className="font-display font-semibold text-gray-800 mb-4">Learning DNA</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Style */}
          <div className="bg-primary/5 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Phong cách học</p>
            <p className="font-display font-bold text-primary text-sm">
              {STYLE_LABELS[dna.dominant_style] ?? dna.dominant_style}
            </p>
          </div>

          {/* Burnout */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Nguy cơ kiệt sức</p>
            <Badge variant={RISK_VARIANT[dna.burnout_risk]}>
              {RISK_LABELS[dna.burnout_risk]}
            </Badge>
          </div>

          {/* Consistency */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Tính ổn định</p>
            <div className="flex items-end gap-1">
              <span className="font-display font-bold text-gray-800 text-lg">{dna.consistency_score}</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>

          {/* Improvement */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Tốc độ cải thiện</p>
            <p className={cn('font-bold text-sm', Number(dna.improvement_rate) >= 0 ? 'text-success' : 'text-danger')}>
              {Number(dna.improvement_rate) >= 0 ? '+' : ''}{Number(dna.improvement_rate).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Strengths */}
        {dna.strengths.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1.5">Môn mạnh</p>
            <div className="flex flex-wrap gap-1.5">
              {dna.strengths.map((s) => (
                <Badge key={s} variant="success">{SUBJECT_LABELS[s] ?? s}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {dna.weaknesses.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Môn cần cải thiện</p>
            <div className="flex flex-wrap gap-1.5">
              {dna.weaknesses.map((s) => (
                <Badge key={s} variant="warning">{SUBJECT_LABELS[s] ?? s}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    )
  },
)
LearningDNACard.displayName = 'LearningDNACard'
