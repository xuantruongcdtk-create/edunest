import type { ScoreRecord, LearningDNA, Subject, LearningStyle, BurnoutRisk } from '@edunest/types'

/**
 * Pure function — no I/O. Computes LearningDNA from raw score records.
 * Called by `learning-dna.service.ts` which handles persistence.
 */
export function computeLearningDNA(childId: string, records: ScoreRecord[]): LearningDNA {
  if (records.length === 0) {
    return {
      child_id:          childId,
      dominant_style:    'reading',
      burnout_risk:      'low',
      strengths:         [],
      weaknesses:        [],
      consistency_score: 0,
      improvement_rate:  0,
      computed_at:       new Date().toISOString(),
    }
  }

  const bySubject = groupBySubject(records)
  const subjectAvgs = computeSubjectAverages(bySubject)

  const sorted = Object.entries(subjectAvgs).sort(([, a], [, b]) => b - a)
  const strengths  = sorted.slice(0, 3).map(([s]) => s as Subject)
  const weaknesses = sorted.slice(-3).map(([s]) => s as Subject)

  const consistency = computeConsistency(bySubject)
  const improvement = computeImprovementRate(bySubject)
  const burnoutRisk = deriveBurnoutRisk(consistency, improvement, records.length)
  const style       = inferLearningStyle(subjectAvgs)

  return {
    child_id:          childId,
    dominant_style:    style,
    burnout_risk:      burnoutRisk,
    strengths,
    weaknesses,
    consistency_score: consistency,
    improvement_rate:  improvement,
    computed_at:       new Date().toISOString(),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupBySubject(records: ScoreRecord[]): Record<string, number[]> {
  return records.reduce<Record<string, number[]>>((acc, r) => {
    const pct = (r.score / r.max_score) * 10
    ;(acc[r.subject] ??= []).push(pct)
    return acc
  }, {})
}

function computeSubjectAverages(bySubject: Record<string, number[]>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(bySubject).map(([s, scores]) => [
      s,
      scores.reduce((a, b) => a + b, 0) / scores.length,
    ]),
  )
}

function computeConsistency(bySubject: Record<string, number[]>): number {
  const variances = Object.values(bySubject).map((scores) => {
    if (scores.length < 2) return 0
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    return scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length
  })
  const avgVariance = variances.reduce((a, b) => a + b, 0) / (variances.length || 1)
  return Math.max(0, Math.round(100 - avgVariance * 10))
}

function computeImprovementRate(bySubject: Record<string, number[]>): number {
  const deltas = Object.values(bySubject)
    .filter((s) => s.length >= 2)
    .map((s) => s[s.length - 1] - s[s.length - 2])
  if (!deltas.length) return 0
  return Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
}

function deriveBurnoutRisk(
  consistency: number,
  improvement: number,
  recordCount: number,
): BurnoutRisk {
  if (consistency < 40 && improvement < -1 && recordCount > 5) return 'high'
  if (consistency < 65 || improvement < -0.5) return 'medium'
  return 'low'
}

function inferLearningStyle(avgs: Record<string, number>): LearningStyle {
  const visual    = ['history', 'geography', 'biology']
  const reading   = ['literature', 'civics']
  const analytic  = ['math', 'physics', 'chemistry', 'informatics']

  const score = (subjects: string[]) =>
    subjects.filter((s) => s in avgs).reduce((sum, s) => sum + avgs[s], 0)

  const scores = {
    visual:    score(visual),
    reading:   score(reading),
    kinesthetic: score(analytic),
    auditory:  score(['english']),
  }

  return (Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0] as LearningStyle)
}
