import { getServerClient }                         from '@edunest/db'
import { ok, created, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

function generateJoinCode(): string {
  // Exclude visually confusable chars: 0/O, 1/I/L
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

const CreateSchema = z.object({
  name:         z.string().min(1).max(50),
  grade:        z.number().int().min(1).max(12),
  academicYear: z.string().min(1).max(20).default('2025-2026'),
})

export const GET = withHandler(async (_req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const { data, error } = await (db as any)
    .from('classes')
    .select('id, name, grade, academic_year, join_code, student_count, created_at')
    .eq('teacher_id', user.id)
    .order('grade', { ascending: true })

  if (error) throw new Error(error.message)
  return ok(data ?? [])
})

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  // Retry up to 3 times in case of join_code collision (extremely rare)
  let lastErr: string = 'Failed to generate unique join code'
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await (db as any)
      .from('classes')
      .insert({
        teacher_id:    user.id,
        name:          parsed.data.name.trim(),
        grade:         parsed.data.grade,
        academic_year: parsed.data.academicYear,
        join_code:     generateJoinCode(),
      })
      .select()
      .single()

    if (!error) return created(data)
    if (!(error.message as string).includes('unique')) throw new Error(error.message)
    lastErr = error.message
  }

  throw new Error(lastErr)
})
