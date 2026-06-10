import { getServerClient } from '@edunest/db'
import { submitAttempt } from '@edunest/services'
import { ok, apiError, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const AttemptSchema = z.object({
  quizId:           z.string().uuid(),
  answers:          z.array(z.number().int().min(0)).min(1),
  timeTakenSeconds: z.number().int().min(0),
})

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const body = await req.json()
  const parsed = AttemptSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  const attempt = await submitAttempt(
    parsed.data.quizId,
    user.id,
    parsed.data.answers,
    parsed.data.timeTakenSeconds,
  )
  return ok(attempt)
})
