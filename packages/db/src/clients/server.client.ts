import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'
import type { Database } from '../types'

function bearerToken(headerValue: string | null): string | null {
  if (!headerValue?.startsWith('Bearer ')) return null
  const token = headerValue.slice('Bearer '.length).trim()
  return token || null
}

/**
 * Server Supabase client.
 * - Web (browser) requests authenticate via auth cookies (@supabase/ssr).
 * - Mobile / API requests send `Authorization: Bearer <access_token>`; we build a
 *   client that carries that token so PostgREST applies the user's RLS.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function getServerClient(): Promise<SupabaseClient<Database>> {
  const token = bearerToken((await headers()).get('authorization'))
  if (token) {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      },
    )
  }

  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (pairs) =>
          pairs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  ) as unknown as SupabaseClient<Database>
}

/**
 * Resolves the current user from either a Bearer token (mobile/API) or auth cookies (web).
 * Use this in route handlers instead of `getServerClient().auth.getUser()` so that both
 * transports work — the Bearer client has no persisted session, so getUser() needs the token.
 */
export async function getAuthUser(): Promise<User | null> {
  const token = bearerToken((await headers()).get('authorization'))
  if (token) {
    const anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
    )
    const { data } = await anon.auth.getUser(token)
    return data.user ?? null
  }
  const db = await getServerClient()
  const { data } = await db.auth.getUser()
  return data.user ?? null
}
