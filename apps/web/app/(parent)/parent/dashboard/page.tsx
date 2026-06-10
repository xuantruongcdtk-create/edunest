import { redirect }            from 'next/navigation'
import type { Metadata }       from 'next'
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
    .order('created_at')

  const kids = (children ?? []) as { id: string; full_name: string; grade: number }[]
  if (kids.length === 0) redirect('/onboarding/step-1')

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

  const lastMsg = (() => {
    const msgs = (coachRes as { data: { messages: Array<{ role: string; content: string }> } | null }).data?.messages
    if (!Array.isArray(msgs) || msgs.length === 0) return undefined
    return msgs.filter((m) => m.role === 'model').at(-1)?.content
  })()

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title={`Dashboard · ${activeChild.full_name}`}
        actions={<ChildSwitcher children={kids} activeChildId={activeChild.id} />}
      />
      <div className="p-6 space-y-6 flex-1">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Điểm trung bình"   value={avgScore.toFixed(1)} unit="/10" icon="⭐" accent="primary" />
          <StatCard label="Số môn theo dõi"   value={scores.length}                  icon="📚" accent="success" />
          <StatCard label="Cảnh báo chưa đọc" value={alerts.filter((a) => !a.is_read).length} icon="🔔" accent="warning" />
          <StatCard label="Lớp"               value={`${activeChild.grade}`}          icon="🎓" accent="accent" />
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
