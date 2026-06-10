import { redirect }          from 'next/navigation'
import type { Metadata }     from 'next'
import { getServerClient }   from '@edunest/db'
import { adminClient }       from '@edunest/db'
import { Topbar }            from '../../../../components/layout/Topbar'
import { AdminStatRow }      from '../../../../components/admin/AdminStatRow'
import { UserTable }         from '../../../../components/admin/UserTable'
import { FeatureFlagPanel }  from '../../../../components/admin/FeatureFlagPanel'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminDashboard() {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const [usersRes, flagsRes, recentUsersRes] = await Promise.all([
    adminClient.from('profiles').select('role'),
    db.from('feature_flags').select('key, enabled, description, rollout_pct').order('key'),
    adminClient
      .from('profiles')
      .select('id, email, full_name, role, plan_tier, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const allUsers    = (usersRes.data ?? []) as { role: string }[]
  const flags       = (flagsRes.data ?? []) as { key: string; enabled: boolean; description: string | null; rollout_pct: number }[]
  const recentUsers = (recentUsersRes.data ?? []) as Parameters<typeof UserTable>[0]['users']

  const stats = {
    totalUsers:    allUsers.length,
    totalParents:  allUsers.filter((u) => u.role === 'parent').length,
    totalTeachers: allUsers.filter((u) => u.role === 'teacher').length,
    totalSchools:  0,
  }

  const { count: schoolCount } = await adminClient
    .from('schools')
    .select('id', { count: 'exact', head: true })
  stats.totalSchools = schoolCount ?? 0

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Admin Dashboard" />
      <div className="p-6 space-y-6">
        <AdminStatRow stats={stats} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserTable users={recentUsers} />
          <FeatureFlagPanel flags={flags} />
        </div>
      </div>
    </div>
  )
}
