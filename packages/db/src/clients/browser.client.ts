import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

/** Singleton browser Supabase client (safe for React components). */
export function getBrowserClient() {
  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _client
}
