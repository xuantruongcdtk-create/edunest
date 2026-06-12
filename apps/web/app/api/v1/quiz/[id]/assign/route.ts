import { getServerClient } from '@edunest/db'
import { ok, created, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const AssignSchema = z.object({
  classId: z.string().uuid(),
  dueDate: z.string().nullable().optional(),
})

// Chuẩn hoá hạn nộp về ISO (yyyy-mm-dd). Nhận cả ISO lẫn dd/mm/yyyy. Sai → null.
function normalizeDueDate(s: string | null | undefined): string | null {
  if (!s || !s.trim()) return null
  const t = s.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10)          // đã là ISO
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)             // dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

export function GET(req: Request, { params }: { params: { id: string } }) {
  return withHandler(async (_req) => {
    const { id } = params
    const db = await getServerClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { data, error } = await (db as any)
      .from('quiz_assignments')
      .select(`
        id, due_date, created_at, class_id,
        class:classes!class_id ( id, name, grade, student_count )
      `)
      .eq('quiz_id', id)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return ok(data ?? [])
  })(req)
}

export function POST(req: Request, { params }: { params: { id: string } }) {
  return withHandler(async (_req) => {
    const { id } = params
    const db = await getServerClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) throw new UnauthorizedError()

    // Verify teacher owns this quiz
    const { data: quiz } = await db
      .from('quizzes')
      .select('id, status')
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single()
    if (!quiz) throw new UnauthorizedError()

    const body = await req.json()
    const parsed = AssignSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

    const { data, error } = await (db as any)
      .from('quiz_assignments')
      .upsert(
        {
          quiz_id:     id,
          class_id:    parsed.data.classId,
          assigned_by: user.id,
          due_date:    normalizeDueDate(parsed.data.dueDate),
        },
        { onConflict: 'quiz_id,class_id' },
      )
      .select(`
        id, due_date, class_id,
        class:classes!class_id ( id, name, grade, student_count )
      `)
      .single()

    if (error) throw new Error(error.message)
    return created(data)
  })(req)
}

export function DELETE(req: Request, { params }: { params: { id: string } }) {
  return withHandler(async (_req) => {
    const { id } = params
    const classId = new URL(req.url).searchParams.get('classId')
    if (!classId) throw new ValidationError('classId query param required')

    const db = await getServerClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { error } = await db
      .from('quiz_assignments')
      .delete()
      .eq('quiz_id',     id)
      .eq('class_id',    classId)
      .eq('assigned_by', user.id)

    if (error) throw new Error(error.message)
    return ok({ deleted: true })
  })(req)
}
