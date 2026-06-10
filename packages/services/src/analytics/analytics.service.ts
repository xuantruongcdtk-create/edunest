import { getServerClient, assertNoError } from '@edunest/db'
import { withCache, CacheKeys, TTL } from '@edunest/cache'
import type { SubjectScore, WeeklySummary } from '@edunest/types'

export async function getSubjectScores(
  childId: string,
  academicYear: string,
): Promise<SubjectScore[]> {
  return withCache(CacheKeys.subjectScores(childId), TTL.dashboard, async () => {
    const db = await getServerClient()
    const { data, error } = await db
      .from('score_records')
      .select('subject, score, max_score, exam_date')
      .eq('child_id', childId)
      .eq('academic_year', academicYear)
      .order('exam_date', { ascending: true })
    assertNoError(error)

    const map = new Map<string, number[]>()
    for (const row of data ?? []) {
      const pct = ((row as { score: number; max_score: number }).score /
        (row as { score: number; max_score: number }).max_score) * 10
      if (!map.has((row as { subject: string }).subject)) map.set((row as { subject: string }).subject, [])
      map.get((row as { subject: string }).subject)!.push(pct)
    }

    return Array.from(map.entries()).map(([subject, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      const trend = scores.length >= 2
        ? scores[scores.length - 1] - scores[scores.length - 2]
        : 0
      return {
        subject:       subject as SubjectScore['subject'],
        average:       Math.round(avg * 10) / 10,
        trend:         Math.round(trend * 10) / 10,
        attempt_count: scores.length,
      }
    })
  })
}

export async function getWeeklySummary(
  childId: string,
  weekStart: string,
): Promise<WeeklySummary | null> {
  return withCache(CacheKeys.weeklySummary(childId, weekStart), TTL.weeklySummary, async () => {
    const db = await getServerClient()
    const { data, error } = await db
      .from('weekly_summaries')
      .select('*')
      .eq('child_id', childId)
      .eq('week_start', weekStart)
      .single()

    if (error?.code === 'PGRST116') return null
    assertNoError(error)
    return data as WeeklySummary
  })
}
