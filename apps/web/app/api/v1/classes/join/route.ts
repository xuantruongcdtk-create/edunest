import { getServerClient, getAuthUser }            from '@edunest/db'
import { ok, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const JoinSchema = z.object({
  joinCode: z.string().min(4).max(10),
  childId:  z.string().uuid(),
})

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const user = await getAuthUser()
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

  // Tra cứu lớp theo mã qua hàm SECURITY DEFINER (RLS chặn phụ huynh đọc lớp chưa tham gia)
  const { data: clsRows } = await (db as any).rpc('find_class_by_join_code', {
    p_code: joinCode.toUpperCase().trim(),
  })
  const cls = ((clsRows ?? []) as { id: string; name: string; grade: number; teacher_name: string }[])[0]

  if (!cls) throw new ValidationError('Mã lớp không tồn tại. Vui lòng kiểm tra lại mã giáo viên cung cấp.')

  // Check if child already enrolled
  const { data: existing } = await (db as any)
    .from('class_memberships')
    .select('id')
    .eq('class_id', cls.id)
    .eq('child_id', childId)
    .maybeSingle()

  if (existing) {
    throw new ValidationError(
      `${(child as any).full_name} đã là thành viên của lớp ${cls.name} rồi.`,
    )
  }

  // Enroll child
  const { error } = await (db as any)
    .from('class_memberships')
    .insert({ class_id: cls.id, child_id: childId })

  if (error) throw new Error(error.message)

  return ok({
    className:   cls.name,
    classGrade:  cls.grade,
    teacherName: cls.teacher_name ?? 'Giáo viên',
    childName:   (child as any).full_name,
  })
})
