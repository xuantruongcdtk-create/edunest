import { getServerClient, assertNoError } from '@edunest/db'
import { invalidateChildCache } from '@edunest/cache'
import type { ScoreRecord, Subject, PeriodType, SemesterNumber } from '@edunest/types'
import { ValidationError } from '@edunest/core'

export interface AddScoreInput {
  childId: string
  userId: string          // parent performing the action
  subject: Subject
  score: number
  maxScore: number
  periodType: PeriodType
  semester: SemesterNumber
  academicYear: string    // e.g. "2025-2026"
  examDate: string        // ISO date
  source?: 'manual' | 'ocr'
  pdfUrl?: string
}

export async function addScore(input: AddScoreInput): Promise<ScoreRecord> {
  if (input.score < 0 || input.score > input.maxScore) {
    throw new ValidationError(`Score ${input.score} must be between 0 and ${input.maxScore}`)
  }

  const db = await getServerClient()
  const { data, error } = await db
    .from('score_records')
    .insert({
      child_id:      input.childId,
      subject:       input.subject,
      score:         input.score,
      max_score:     input.maxScore,
      period_type:   input.periodType,
      semester:      input.semester,
      academic_year: input.academicYear,
      exam_date:     input.examDate,
      source:        input.source ?? 'manual',
      pdf_url:       input.pdfUrl,
    })
    .select()
    .single()

  assertNoError(error)
  await invalidateChildCache(input.childId, input.userId)
  return data as ScoreRecord
}

export async function getScoresByChild(
  childId: string,
  academicYear: string,
): Promise<ScoreRecord[]> {
  const db = await getServerClient()
  const { data, error } = await db
    .from('score_records')
    .select('*')
    .eq('child_id', childId)
    .eq('academic_year', academicYear)
    .order('exam_date', { ascending: false })

  assertNoError(error)
  return (data ?? []) as ScoreRecord[]
}
