import { redirect }           from 'next/navigation'
import type { Metadata }       from 'next'
import { getServerClient }     from '@edunest/db'
import { getQuizzesByTeacher } from '@edunest/services'
import { Topbar }              from '../../../../components/layout/Topbar'
import { TeacherStatRow }      from '../../../../components/teacher/TeacherStatRow'
import { StudentTable }        from '../../../../components/teacher/StudentTable'
import { QuizAssignedList }    from '../../../../components/teacher/QuizAssignedList'
import { AlertList }           from '../../../../components/dashboard/AlertList'

export const metadata: Metadata = { title: 'Lớp học' }

export default async function TeacherDashboard() {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const [classesRes, quizzes, alertsRes] = await Promise.all([
    db.from('classes')
      .select('id, name, grade, student_count')
      .eq('teacher_id', user.id)
      .order('name'),
    getQuizzesByTeacher(user.id).catch(() => []),
    db.from('alerts')
      .select('id, type, severity, title, body, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const classes = (classesRes.data ?? []) as { id: string; name: string; grade: number; student_count: number }[]
  const alerts  = (alertsRes.data ?? []) as Parameters<typeof AlertList>[0]['alerts']

  const classIds = classes.map((c) => c.id)
  let students: { id: string; full_name: string; grade: number; avg_score: number | null; quiz_count: number }[] = []

  if (classIds.length > 0) {
    const { data: memberships } = await db
      .from('class_memberships')
      .select('child_id, children(id, full_name, grade)')
      .in('class_id', classIds)
      .limit(50)

    const childrenList = (memberships ?? []).map((m) => {
      const c = (m as { child_id: string; children: { id: string; full_name: string; grade: number } | null }).children
      return c ? { id: c.id, full_name: c.full_name, grade: c.grade } : null
    }).filter(Boolean) as { id: string; full_name: string; grade: number }[]

    const uniqueChildren = Array.from(new Map(childrenList.map((c) => [c.id, c])).values())
    students = await Promise.all(uniqueChildren.map(async (child) => {
      const { count } = await db
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', child.id)

      const { data: scores } = await db
        .from('score_records')
        .select('score, max_score')
        .eq('child_id', child.id)

      const avg = scores?.length
        ? scores.reduce((s, r: { score: number; max_score: number }) => s + (r.score / r.max_score) * 10, 0) / scores.length
        : null

      return {
        ...child,
        avg_score:  avg != null ? Math.round(avg * 10) / 10 : null,
        quiz_count: count ?? 0,
      }
    }))
  }

  const totalStudents = students.length
  const avgScore = students.filter((s) => s.avg_score != null)
    .reduce((sum, s) => sum + (s.avg_score ?? 0), 0)
    / Math.max(students.filter((s) => s.avg_score != null).length, 1)

  const stats = {
    totalStudents,
    totalClasses: classes.length,
    avgScore:     isNaN(avgScore) ? 0 : avgScore,
    quizRate:     0,
  }

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Dashboard Giáo Viên" />
      <div className="p-6 space-y-6">
        <TeacherStatRow stats={stats} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <StudentTable students={students} />
          </div>
          <div className="space-y-6">
            <QuizAssignedList quizzes={quizzes} />
            <AlertList alerts={alerts} />
          </div>
        </div>
      </div>
    </div>
  )
}
