import { getAuthUser } from '@edunest/db'
import { submitAttempt } from '@edunest/services'
import { ok, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const AttemptSchema = z.object({
  quizId:           z.string().uuid(),
  childId:          z.string().uuid().optional(),
  // số = đáp án trắc nghiệm (index); chuỗi = bài làm tự luận
  answers:          z.array(z.union([z.number().int().min(0), z.string()])).min(1),
  timeTakenSeconds: z.number().int().min(0),
})

export const POST = withHandler(async (req) => {
  const user = await getAuthUser()
  if (!user) throw new UnauthorizedError()

  const body = await req.json()
  const parsed = AttemptSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  // Use childId when parent submits on behalf of child; otherwise use own ID
  const studentId = parsed.data.childId ?? user.id

  const attempt = await submitAttempt(
    parsed.data.quizId,
    studentId,
    parsed.data.answers,
    parsed.data.timeTakenSeconds,
  )
  return ok(attempt)
})
