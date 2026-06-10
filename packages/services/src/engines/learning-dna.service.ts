import { getServerClient, assertNoError } from '@edunest/db'
import { withCache, CacheKeys, TTL } from '@edunest/cache'
import type { LearningDNA, ScoreRecord } from '@edunest/types'
import { computeLearningDNA } from './learning-dna.engine'

export async function getLearningDNA(childId: string, academicYear: string): Promise<LearningDNA> {
  return withCache(CacheKeys.learningDNA(childId), TTL.learningDNA, async () => {
    return recomputeAndPersist(childId, academicYear)
  })
}

export async function recomputeAndPersist(
  childId: string,
  academicYear: string,
): Promise<LearningDNA> {
  const db = await getServerClient()

  const { data: records, error } = await db
    .from('score_records')
    .select('*')
    .eq('child_id', childId)
    .eq('academic_year', academicYear)
    .order('exam_date', { ascending: true })
  assertNoError(error)

  const dna = computeLearningDNA(childId, (records ?? []) as ScoreRecord[])

  // Persist into weekly_summaries latest row (or a dedicated table if added)
  // For now, we just return the computed value; caching handles durability.
  return dna
}
