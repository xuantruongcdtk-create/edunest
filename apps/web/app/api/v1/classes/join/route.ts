import { getServerClient }                         from '@edunest/db'
import { ok, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const JoinSchema = z.object({
  joinCode: z.string().min(4).max(10),
  childId:  z.string().uuid(),
})

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const body = await req.json()
  const parsed = JoinSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  const { joinCode, childId } = parsed.data

  // Verify parent owns this child
  const { data: child } = await db
    .from('children')
    .select('id, full_name, grade')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single()
  if (!child) throw new UnauthorizedError('Không tìm thấy hồ sơ con')

  // Find class by join code (case-insensitive)
  const { data: cls } = await (db as any)
    .from('classes')
    .select(`
      id, name, grade,
      teacher:profiles!teacher_id ( full_name )
    `)
    .eq('join_code', joinCode.toUpperCase().trim())
    .single()

  if (!cls) throw new ValidationError('Mã lớp không tồn tại. Vui lòng kiểm tra lại mã giáo viên cung cấp.')

  // Check if child already enrolled
  const { data: existing } = await (db as any)
    .from('class_memberships')
    .select('id')
    .eq('class_id', (cls as any).id)
    .eq('child_id', childId)
    .maybeSingle()

  if (existing) {
    throw new ValidationError(
      `${(child as any).full_name} đã là thành viên của lớp ${(cls as any).name} rồi.`,
    )
  }

  // Enroll child
  const { error } = await (db as any)
    .from('class_memberships')
    .insert({ class_id: (cls as any).id, child_id: childId })

  if (error) throw new Error(error.message)

  return ok({
    className:   (cls as any).name,
    classGrade:  (cls as any).grade,
    teacherName: (cls as any).teacher?.full_name ?? 'Giáo viên',
    childName:   (child as any).full_name,
  })
})
