import { getServerClient, assertNoError } from '@edunest/db'
import { generateText, AI_MODEL, checkAIRateLimit } from '@edunest/ai'
import { withCache, CacheKeys, TTL, invalidateTeacherCache } from '@edunest/cache'
import type { Quiz, QuizQuestion, QuizAttempt, Subject, GradeLevel, QuizDifficulty } from '@edunest/types'
import { NotFoundError, ValidationError } from '@edunest/core'

// ─── Generate ─────────────────────────────────────────────────────────────────

export interface GenerateQuizInput {
  teacherId: string
  subject: Subject
  grade: GradeLevel
  difficulty: QuizDifficulty
  questionCount: number       // số câu trắc nghiệm
  essayCount?: number         // số câu tự luận
  timeLimitMinutes: number
  topic?: string
}

export async function generateQuiz(
  input: GenerateQuizInput,
): Promise<Quiz & { questions: QuizQuestion[] }> {
  await checkAIRateLimit(input.teacherId, 'quiz')

  const mcqCount   = input.questionCount
  const essayCount = input.essayCount ?? 0
  const total      = mcqCount + essayCount

  const prompt = `Tạo bài kiểm tra môn ${input.subject} lớp ${input.grade}, mức ${input.difficulty}.${input.topic ? ` Chủ đề: ${input.topic}.` : ''}
Gồm ${mcqCount} câu TRẮC NGHIỆM và ${essayCount} câu TỰ LUẬN.
Trả về JSON hợp lệ, KHÔNG kèm giải thích ngoài JSON:
{
  "title": string,
  "questions": [
    // câu trắc nghiệm:
    { "question_type": "mcq", "question_text": string, "options": string[4], "correct_index": number(0-3), "explanation": string },
    // câu tự luận:
    { "question_type": "essay", "question_text": string, "sample_answer": string (đáp án mẫu/tiêu chí chấm), "explanation": string }
  ]
}
Đặt câu trắc nghiệm trước, tự luận sau.`

  const raw = await generateText(prompt, AI_MODEL)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new ValidationError('AI trả về JSON không hợp lệ')
  const parsed = JSON.parse(match[0])

  const db = await getServerClient()
  const { data: quiz, error: qe } = await (db as any)
    .from('quizzes')
    .insert({
      teacher_id:         input.teacherId,
      title:              parsed.title,
      subject:            input.subject,
      grade:              input.grade,
      difficulty:         input.difficulty,
      status:             'draft',
      question_count:     total,
      time_limit_minutes: input.timeLimitMinutes,
    })
    .select()
    .single()
  assertNoError(qe)

  const rows = (parsed.questions as any[]).map((q, i: number) => {
    const isEssay = q.question_type === 'essay'
    return {
      quiz_id:       (quiz as Quiz).id,
      question_text: q.question_text,
      question_type: isEssay ? 'essay' : 'mcq',
      options:       isEssay ? [] : (q.options ?? []),
      correct_index: isEssay ? null : (q.correct_index ?? 0),
      sample_answer: isEssay ? (q.sample_answer ?? null) : null,
      explanation:   q.explanation ?? null,
      order_index:   i,
    }
  })
  const { data: questions, error: qse } = await (db as any)
    .from('quiz_questions')
    .insert(rows)
    .select()
  assertNoError(qse)

  await invalidateTeacherCache(input.teacherId)
  return { ...(quiz as Quiz), questions: (questions ?? []) as QuizQuestion[] }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getQuizzesByTeacher(teacherId: string): Promise<Quiz[]> {
  return withCache(CacheKeys.quizList(teacherId), TTL.quizList, async () => {
    const db = await getServerClient()
    const { data, error } = await db
      .from('quizzes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
    assertNoError(error)
    return (data ?? []) as Quiz[]
  })
}

// ─── Attempt ─────────────────────────────────────────────────────────────────

const POINTS_PER_Q = 10   // mỗi câu tối đa 10 điểm (trắc nghiệm: đúng=10/sai=0; tự luận: 0..10 do AI chấm)

interface QRow {
  question_type: 'mcq' | 'essay'
  question_text: string
  correct_index: number | null
  sample_answer: string | null
}
interface AttemptDetail {
  type:     'mcq' | 'essay'
  score:    number
  max:      number
  correct?: boolean
  feedback?: string
}

export async function submitAttempt(
  quizId: string,
  studentId: string,
  answers: (number | string)[],
  timeTakenSeconds: number,
): Promise<QuizAttempt & { details: AttemptDetail[] }> {
  const db = await getServerClient()
  const { data: rows, error } = await (db as any)
    .from('quiz_questions')
    .select('question_type, question_text, correct_index, sample_answer')
    .eq('quiz_id', quizId)
    .order('order_index')
  assertNoError(error)

  const questions = (rows ?? []) as QRow[]
  if (!questions.length) throw new NotFoundError('Quiz', quizId)
  if (answers.length !== questions.length)
    throw new ValidationError(`Expected ${questions.length} answers, got ${answers.length}`)

  const details: AttemptDetail[] = questions.map((q) => ({
    type: q.question_type === 'essay' ? 'essay' : 'mcq',
    score: 0,
    max: POINTS_PER_Q,
  }))

  // Chấm trắc nghiệm (so khớp index)
  questions.forEach((q, i) => {
    if (q.question_type !== 'essay') {
      const correct = typeof answers[i] === 'number' && answers[i] === q.correct_index
      details[i]!.correct = correct
      details[i]!.score   = correct ? POINTS_PER_Q : 0
    }
  })

  // Chấm tự luận bằng AI (gộp 1 lần gọi)
  const essayIdx = questions.map((q, i) => ({ q, i })).filter((x) => x.q.question_type === 'essay')
  if (essayIdx.length > 0) {
    const items = essayIdx.map(({ q, i }, n) => ({
      n,
      question: q.question_text,
      sample_answer: q.sample_answer ?? '',
      student_answer: String(answers[i] ?? '').slice(0, 2000),
    }))
    const gradePrompt = `Bạn là giáo viên chấm bài tự luận. Chấm mỗi câu trên thang 0-${POINTS_PER_Q} điểm dựa trên đáp án mẫu, và viết nhận xét ngắn (1-2 câu) bằng tiếng Việt.
Trả về JSON hợp lệ, KHÔNG kèm chữ nào khác: { "results": [{ "n": number, "score": number(0-${POINTS_PER_Q}), "feedback": string }] }
Dữ liệu:
${JSON.stringify(items)}`

    try {
      const raw   = await generateText(gradePrompt, AI_MODEL)
      const match = raw.match(/\{[\s\S]*\}/)
      const out   = match ? JSON.parse(match[0]) : { results: [] }
      const byN   = new Map<number, { score: number; feedback: string }>()
      for (const r of (out.results ?? []) as { n: number; score: number; feedback: string }[]) {
        byN.set(r.n, { score: Math.max(0, Math.min(POINTS_PER_Q, Math.round(r.score))), feedback: r.feedback })
      }
      essayIdx.forEach(({ i }, n) => {
        const g = byN.get(n)
        details[i]!.score    = g?.score ?? 0
        details[i]!.feedback = g?.feedback ?? 'Chưa chấm được tự động — giáo viên sẽ xem lại.'
      })
    } catch {
      essayIdx.forEach(({ i }) => {
        details[i]!.score    = 0
        details[i]!.feedback = 'Chưa chấm được tự động — giáo viên sẽ xem lại.'
      })
    }
  }

  const score    = details.reduce((s, d) => s + d.score, 0)
  const maxScore = questions.length * POINTS_PER_Q

  const { data: attempt, error: ae } = await (db as any)
    .from('quiz_attempts')
    .insert({
      quiz_id:            quizId,
      student_id:         studentId,
      answers,
      score,
      max_score:          maxScore,
      time_taken_seconds: timeTakenSeconds,
      details,
    })
    .select()
    .single()
  assertNoError(ae)
  return { ...(attempt as QuizAttempt), details }
}
