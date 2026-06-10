import { getServerClient, assertNoError } from '@edunest/db'
import { generateText, AI_MODEL_PRO } from '@edunest/ai'
import type { WeeklySummary, SubjectScore, LearningDNA } from '@edunest/types'

interface BuildSummaryInput {
  childId: string
  weekStart: string    // ISO date, Monday of the week
  subjectScores: SubjectScore[]
  dna: LearningDNA
  quizCompletionRate: number
  studyTimeMinutes: number
}

export async function buildWeeklySummary(input: BuildSummaryInput): Promise<WeeklySummary> {
  const aiInsight = await generateInsight(input)

  const db = await getServerClient()
  const { data, error } = await db
    .from('weekly_summaries')
    .upsert(
      {
        child_id:              input.childId,
        week_start:            input.weekStart,
        subject_scores:        input.subjectScores,
        quiz_completion_rate:  input.quizCompletionRate,
        study_time_minutes:    input.studyTimeMinutes,
        learning_dna:          input.dna,
        ai_insight:            aiInsight,
      },
      { onConflict: 'child_id,week_start' },
    )
    .select()
    .single()
  assertNoError(error)
  return data as WeeklySummary
}

async function generateInsight(input: BuildSummaryInput): Promise<string> {
  const top = input.subjectScores
    .sort((a, b) => b.average - a.average)
    .slice(0, 3)
    .map((s) => `${s.subject}: ${s.average}`)
    .join(', ')

  const prompt = `Phụ huynh Việt Nam. Con có các môn điểm cao: ${top}. Phong cách học: ${input.dna.dominant_style}. Nguy cơ kiệt sức: ${input.dna.burnout_risk}. Viết 2 câu nhận xét ngắn gọn, thực tế, tích cực.`

  return generateText(prompt, AI_MODEL_PRO)
}
