import { getServerClient, assertNoError } from '@edunest/db'
import { withCache, CacheKeys, TTL } from '@edunest/cache'
import { ok, withHandler, UnauthorizedError, ForbiddenError } from '@edunest/core'

export const GET = withHandler(async (_req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const { data: profile } = await db
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  const p = profile as { role: string; school_id: string | null } | null
  if (!p || !['bgh', 'admin'].includes(p.role)) throw new ForbiddenError()
  if (!p.school_id) throw new ForbiddenError()

  const schoolId = p.school_id

  const kpi = await withCache(CacheKeys.schoolKPI(schoolId), TTL.schoolKPI, async () => {
    const [schoolRes, childrenRes, scoresRes, classesRes] = await Promise.all([
      db.from('schools').select('name, student_count').eq('id', schoolId).single(),
      db.from('children').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
      db.from('score_records')
        .select('score, max_score')
        .in(
          'child_id',
          (await db.from('children').select('id').eq('school_id', schoolId)).data?.map((c: { id: string }) => c.id) ?? [],
        ),
      db.from('classes').select('id, name, student_count').eq('school_id', schoolId).order('name'),
    ])

    assertNoError(schoolRes.error)

    const school = schoolRes.data as { name: string; student_count: number }
    const totalStudents = childrenRes.count ?? 0
    const scores = (scoresRes.data ?? []) as { score: number; max_score: number }[]
    const avgScore = scores.length
      ? Math.round((scores.reduce((s, r) => s + (r.score / r.max_score) * 10, 0) / scores.length) * 10) / 10
      : 0

    return {
      school_id:     schoolId,
      school_name:   school.name,
      total_students: totalStudents,
      avg_score:     avgScore,
      total_classes: (classesRes.data ?? []).length,
      classes:       classesRes.data ?? [],
    }
  })

  return ok(kpi)
})
