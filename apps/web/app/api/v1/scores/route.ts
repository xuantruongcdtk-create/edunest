import { getServerClient } from '@edunest/db'
import { addScore, getScoresByChild } from '@edunest/services'
import { ok, created, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const AddScoreSchema = z.object({
  childId:      z.string().uuid(),
  subject:      z.string(),
  score:        z.number().min(0),
  maxScore:     z.number().positive(),
  periodType:   z.enum(['weekly', 'monthly', 'semester']),
  semester:     z.number().int().min(1).max(2),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
  examDate:     z.string().datetime({ offset: true }).or(z.string().date()),
  source:       z.enum(['manual', 'ocr']).default('manual'),
  pdfUrl:       z.string().url().optional(),
})

export const GET = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const { searchParams } = new URL(req.url)
  const childId      = searchParams.get('childId') ?? ''
  const academicYear = searchParams.get('academicYear') ?? ''
  if (!childId || !academicYear) throw new ValidationError('childId and academicYear are required')

  const scores = await getScoresByChild(childId, academicYear)
  return ok(scores)
})

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const body   = await req.json()
  const parsed = AddScoreSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  const record = await addScore({ userId: user.id, ...parsed.data } as any)
  return created(record)
})
