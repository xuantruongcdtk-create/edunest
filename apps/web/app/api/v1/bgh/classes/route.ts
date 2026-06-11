import { getServerClient }                                  from '@edunest/db'
import { invalidateSchoolCache }                              from '@edunest/cache'
import { created, withHandler, UnauthorizedError, ForbiddenError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const CreateClassSchema = z.object({
  name:         z.string().min(1).max(50),
  grade:        z.number().int().min(1).max(12),
  academicYear: z.string().min(1).max(20).default('2025-2026'),
})

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  // Only BGH/admin with a linked school may add school-wide classes
  const { data: profile } = await db
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  const p = profile as { role: string; school_id: string | null } | null
  if (!p || !['bgh', 'admin'].includes(p.role)) throw new ForbiddenError()
  if (!p.school_id) throw new ForbiddenError('Tài khoản chưa được liên kết với trường.')

  const body = await req.json()
  const parsed = CreateClassSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  const { data, error } = await (db as any)
    .from('classes')
    .insert({
      school_id:     p.school_id,
      teacher_id:    user.id,           // BGH chủ quản lớp; có thể gán GV sau
      name:          parsed.data.name.trim(),
      grade:         parsed.data.grade,
      academic_year: parsed.data.academicYear,
    })
    .select('id, name, grade, student_count')
    .single()

  if (error) throw new Error(error.message)

  // Xóa cache KPI để lớp mới hiện ra ngay
  await invalidateSchoolCache(p.school_id)

  return created(data)
})
