import { redirect }            from 'next/navigation'
import type { Metadata }       from 'next'
import Link                    from 'next/link'
import { getServerClient }     from '@edunest/db'
import { getSubjectScores, getLearningDNA } from '@edunest/services'
import { Topbar }              from '../../../../components/layout/Topbar'
import { StatCard }            from '../../../../components/dashboard/StatCard'
import { SubjectBarChart }     from '../../../../components/dashboard/SubjectBarChart'
import { AlertList }           from '../../../../components/dashboard/AlertList'
import { LearningDNACard }     from '../../../../components/dashboard/LearningDNACard'
import { ChildSwitcher }       from '../../../../components/dashboard/ChildSwitcher'
import { CoachBubble }         from '../../../../components/shared/CoachBubble'

export const metadata: Metadata = { title: 'Dashboard' }

interface PageProps { searchParams: Promise<{ childId?: string }> }

export default async function ParentDashboard({ searchParams }: PageProps) {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams

  const { data: children } = await db
    .from('children')
    .select('id, full_name, grade')
    .eq('parent_id', user.id)

  const kids = (children ?? []) as { id: string; full_name: string; grade: number }[]

  if (kids.length === 0) {
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Dashboard" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">👦</span>
            </div>
            <h2 className="font-display font-extrabold text-xl text-gray-900 mb-2">
              Chưa có hồ sơ học sinh
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Hãy thêm thông tin con để bắt đầu theo dõi điểm số và nhận tư vấn từ AI.
            </p>
            <Link
              href="/parent/children"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-2.5 rounded-btn hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
            >
              <span>+</span> Thêm hồ sơ con
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const activeChild  = kids.find((c) => c.id === sp.childId) ?? kids[0]!
  const academicYear = getCurrentAcademicYear()

  const [scores, dna, alertsRes, coachRes] = await Promise.all([
    getSubjectScores(activeChild.id, academicYear).catch(() => []),
    getLearningDNA(activeChild.id, academicYear).catch(() => null),
    db.from('alerts')
      .select('id, type, severity, title, body, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('coach_conversations')
      .select('messages')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
      .then((res) => res, () => ({ data: null })),
  ])

  const alerts   = (alertsRes.data ?? []) as Parameters<typeof AlertList>[0]['alerts']
  const avgScore = scores.length
    ? scores.map((r) => r.average).reduce((s, a) => s + a, 0) / scores.length
    : 0

  // Điểm TB bài kiểm tra (quiz_attempts) — riêng với điểm môn học nhập tay
  const { data: quizAtts } = await db
    .from('quiz_attempts')
    .select('score, max_score')
    .eq('student_id', activeChild.id)
  const qAtts   = (quizAtts ?? []) as { score: number; max_score: number }[]
  const quizAvg = qAtts.length
    ? qAtts.reduce((s, a) => s + (a.score / a.max_score) * 10, 0) / qAtts.length
    : 0

  const lastMsg = (() => {
    const msgs = (coachRes as { data: { messages: Array<{ role: string; content: string }> } | null }).data?.messages
    if (!Array.isArray(msgs) || msgs.length === 0) return undefined
    return msgs.filter((m) => m.role === 'model').at(-1)?.content
  })()

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title={`Dashboard · ${activeChild.full_name}`}
        actions={<ChildSwitcher kids={kids} activeChildId={activeChild.id} />}
      />
      <div className="p-6 space-y-6 flex-1">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Điểm TB (nhập tay)" value={avgScore.toFixed(1)} unit="/10" icon="⭐" accent="primary" />
          <StatCard label="Điểm TB bài KT"     value={qAtts.length ? quizAvg.toFixed(1) : '—'} unit={qAtts.length ? '/10' : ''} icon="📝" accent="accent" />
          <StatCard label="Số môn theo dõi"   value={scores.length}                  icon="📚" accent="success" />
          <StatCard label="Cảnh báo chưa đọc" value={alerts.filter((a) => !a.is_read).length} icon="🔔" accent="warning" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SubjectBarChart scores={scores} />
            <AlertList alerts={alerts} />
          </div>
          <div className="space-y-6">
            <LearningDNACard dna={dna} />
            <CoachBubble lastMessage={lastMsg} />
          </div>
        </div>
      </div>
    </div>
  )
}

function getCurrentAcademicYear(): string {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}
