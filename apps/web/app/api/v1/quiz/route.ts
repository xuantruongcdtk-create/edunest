import { getServerClient } from '@edunest/db'
import { generateQuiz, getQuizzesByTeacher } from '@edunest/services'
import { ok, created, apiError, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const GenerateSchema = z.object({
  subject:          z.string(),
  grade:            z.number().int().min(1).max(12),
  difficulty:       z.enum(['easy', 'medium', 'hard']),
  questionCount:    z.number().int().min(5).max(20).default(10),
  timeLimitMinutes: z.number().int().min(5).max(90).default(15),
  topic:            z.string().optional(),
})

export const GET = withHandler(async (_req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const quizzes = await getQuizzesByTeacher(user.id)
  return ok(quizzes)
})

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const body = await req.json()
  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  const quiz = await generateQuiz({ teacherId: user.id, ...parsed.data } as any)
  return created(quiz)
})
