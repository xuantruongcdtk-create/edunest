import { redirect }          from 'next/navigation'
import { getServerClient }   from '@edunest/db'
import { DashboardLayout }   from '../../components/layout/DashboardLayout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const p = profile as { full_name: string; role: string } | null
  if (p?.role !== 'admin') redirect('/dashboard')

  return (
    <DashboardLayout role="admin" userName={p?.full_name ?? 'Admin'}>
      {children}
    </DashboardLayout>
  )
}
