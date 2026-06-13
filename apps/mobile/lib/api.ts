import { supabase } from './supabase'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

/**
 * Calls the deployed web API with the current Supabase access token as a Bearer.
 * NOTE: the web `/api/v1/*` routes currently authenticate via SSR cookies; they need
 * to accept this Authorization header before mobile AI features (coach send, quiz gen)
 * will work. Direct Supabase reads/writes (RLS) do not use this helper.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error?.message ?? `Lỗi máy chủ (${res.status})`)
  }
  return json.data as T
}
