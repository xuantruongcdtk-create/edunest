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
  questionCount: number
  timeLimitMinutes: number
  topic?: string
}

export async function generateQuiz(
  input: GenerateQuizInput,
): Promise<Quiz & { questions: QuizQuestion[] }> {
  await checkAIRateLimit(input.teacherId, 'quiz')

  const prompt = `Tạo ${input.questionCount} câu hỏi trắc nghiệm môn ${input.subject} lớp ${input.grade}, mức ${input.difficulty}.${input.topic ? ` Chủ đề: ${input.topic}.` : ''}
Trả về JSON hợp lệ: { "title": string, "questions": [{ "question_text": string, "options": string[4], "correct_index": number, "explanation": string }] }`

  const raw = await generateText(prompt, AI_MODEL)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new ValidationError('AI trả về JSON không hợp lệ')
  const parsed = JSON.parse(match[0])

  const db = await getServerClient()
  const { data: quiz, error: qe } = await db
    .from('quizzes')
    .insert({
      teacher_id:         input.teacherId,
      title:              parsed.title,
      subject:            input.subject,
      grade:              input.grade,
      difficulty:         input.difficulty,
      status:             'draft',
      question_count:     input.questionCount,
      time_limit_minutes: input.timeLimitMinutes,
    })
    .select()
    .single()
  assertNoError(qe)

  const rows = parsed.questions.map((q: QuizQuestion, i: number) => ({
    ...q,
    quiz_id:     (quiz as Quiz).id,
    order_index: i,
  }))
  const { data: questions, error: qse } = await db
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

export async function submitAttempt(
  quizId: string,
  studentId: string,
  answers: number[],
  timeTakenSeconds: number,
): Promise<QuizAttempt> {
  const db = await getServerClient()
  const { data: questions, error } = await db
    .from('quiz_questions')
    .select('correct_index')
    .eq('quiz_id', quizId)
    .order('order_index')
  assertNoError(error)

  if (!questions?.length) throw new NotFoundError('Quiz', quizId)
  if (answers.length !== questions.length)
    throw new ValidationError(`Expected ${questions.length} answers, got ${answers.length}`)

  const score = answers.reduce(
    (sum, ans, i) => sum + (ans === (questions[i] as { correct_index: number }).correct_index ? 1 : 0),
    0,
  )

  const { data: attempt, error: ae } = await db
    .from('quiz_attempts')
    .insert({
      quiz_id:            quizId,
      student_id:         studentId,
      answers,
      score,
      max_score:          questions.length,
      time_taken_seconds: timeTakenSeconds,
    })
    .select()
    .single()
  assertNoError(ae)
  return attempt as QuizAttempt
}
