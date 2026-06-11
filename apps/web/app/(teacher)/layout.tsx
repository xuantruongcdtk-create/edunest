import { redirect }          from 'next/navigation'
import { getServerClient }   from '@edunest/db'
import { DashboardLayout }   from '../../components/layout/DashboardLayout'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, role, onboarding_completed')
    .eq('id', user.id)
    .single()

  const p = profile as { full_name: string; role: string; onboarding_completed: boolean } | null
  if (p && p.role !== 'admin' && !p.onboarding_completed) redirect('/onboarding/step-1')
  if (p?.role && !['teacher', 'admin'].includes(p.role)) redirect('/dashboard')

  return (
    <DashboardLayout role="teacher" userName={p?.full_name ?? 'Giáo viên'} userId={user.id}>
      {children}
    </DashboardLayout>
  )
}
