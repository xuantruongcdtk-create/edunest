import { redirect }        from 'next/navigation'
import { getServerClient } from '@edunest/db'

/**
 * Role-based entry point.
 * Middleware sends all authenticated users here after login.
 * Parent stays here; other roles get redirected to their own URL.
 */
export default async function DashboardHub() {
  const supabase = await getServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  switch ((profile as { role: string } | null)?.role) {
    case 'teacher': redirect('/teacher/dashboard')
    case 'bgh':     redirect('/bgh/dashboard')
    case 'admin':   redirect('/admin/dashboard')
    default:        redirect('/parent/dashboard')
  }
}
