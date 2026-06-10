import { redirect }          from 'next/navigation'
import { getServerClient }   from '@edunest/db'
import { DashboardLayout }   from '../../components/layout/DashboardLayout'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const p = profile as { full_name: string; role: string } | null
  if (p?.role === 'teacher') redirect('/teacher/dashboard')
  if (p?.role === 'bgh')     redirect('/bgh/dashboard')
  if (p?.role === 'admin')   redirect('/admin/dashboard')

  return (
    <DashboardLayout role="parent" userName={p?.full_name ?? 'Phụ huynh'}>
      {children}
    </DashboardLayout>
  )
}
