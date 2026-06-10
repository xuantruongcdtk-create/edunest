import { redirect }        from 'next/navigation'
import type { Metadata }   from 'next'
import { getServerClient } from '@edunest/db'
import { Topbar }          from '../../../../components/layout/Topbar'
import { SchoolKPIGrid }   from '../../../../components/bgh/SchoolKPIGrid'
import { ClassRankTable }  from '../../../../components/bgh/ClassRankTable'

export const metadata: Metadata = { title: 'Tổng quan trường' }

export default async function BghDashboard() {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = (profile as { school_id: string | null } | null)?.school_id
  if (!schoolId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Tài khoản chưa được liên kết với trường học. Vui lòng liên hệ quản trị viên.
      </div>
    )
  }

  const [schoolRes, classesRes, childrenRes, scoresRes] = await Promise.all([
    db.from('schools').select('name, student_count').eq('id', schoolId).single(),
    db.from('classes').select('id, name, grade, student_count').eq('school_id', schoolId).order('name'),
    db.from('children').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
    db.from('score_records')
      .select('score, max_score, child_id')
      .in(
        'child_id',
        ((await db.from('children').select('id').eq('school_id', schoolId)).data ?? []).map((c: { id: string }) => c.id),
      ),
  ])

  const school  = schoolRes.data as { name: string; student_count: number } | null
  const classes = (classesRes.data ?? []) as { id: string; name: string; grade: number; student_count: number }[]
  const scores  = (scoresRes.data ?? []) as { score: number; max_score: number; child_id: string }[]

  const avgScore = scores.length
    ? scores.reduce((s, r) => s + (r.score / r.max_score) * 10, 0) / scores.length
    : 0

  const kpi = {
    school_id:      schoolId,
    school_name:    school?.name ?? '—',
    total_students: childrenRes.count ?? 0,
    avg_score:      Math.round(avgScore * 10) / 10,
    total_classes:  classes.length,
    classes,
  }

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title={school?.name ?? 'Trường học'} />
      <div className="p-6 space-y-6">
        <SchoolKPIGrid kpi={kpi} />
        <ClassRankTable classes={classes} />
      </div>
    </div>
  )
}
