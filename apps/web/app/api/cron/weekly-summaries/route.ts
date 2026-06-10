import { adminClient, assertNoError } from '@edunest/db'
import { buildWeeklySummary, getSubjectScores, getLearningDNA } from '@edunest/services'
import { logger } from '@edunest/core'
import { headers } from 'next/headers'

/** Triggered by Vercel Cron every Monday 06:00 ICT */
export async function GET(req: Request) {
  const headersList = await headers()
  if (headersList.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const weekStart = getLastMonday()
  const { data: children, error } = await (adminClient as any).from('children').select('id')
  assertNoError(error)

  let success = 0, failed = 0
  for (const child of children ?? []) {
    try {
      const year   = weekStart.slice(0, 4)
      const ay     = `${year}-${Number(year) + 1}`
      const scores = await getSubjectScores(child.id, ay)
      const dna    = await getLearningDNA(child.id, ay)
      await buildWeeklySummary({
        childId:            child.id,
        weekStart,
        subjectScores:      scores,
        dna,
        quizCompletionRate: 0, // TODO: compute from quiz_attempts
        studyTimeMinutes:   0, // TODO: compute from session logs
      })
      success++
    } catch (err) {
      logger.error('[Cron] weekly-summary failed', { childId: child.id, error: String(err) })
      failed++
    }
  }

  logger.info('[Cron] weekly-summaries done', { success, failed })
  return Response.json({ ok: true, success, failed })
}

function getLastMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}
