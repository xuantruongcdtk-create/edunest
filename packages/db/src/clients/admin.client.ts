import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types'

/**
 * Service-role admin client — bypasses RLS.
 * SERVER-ONLY. Never expose to the browser or import from client components.
 */
export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)
