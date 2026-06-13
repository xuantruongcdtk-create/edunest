import { create } from 'zustand'
import type { UserRole } from '@edunest/types'
import { supabase } from '../lib/supabase'

interface AuthUser {
  id: string
  email?: string
}

interface AuthState {
  user: AuthUser | null
  role: UserRole | null
  fullName: string | null
  loading: boolean
  init: () => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<UserRole | null>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  fullName: null,
  loading: true,

  async init() {
    const { data: { session } } = await supabase.auth.getSession()
    const u = session?.user ?? null
    set({ user: u ? { id: u.id, email: u.email } : null })
    if (u) await get().loadProfile(u.id)
    set({ loading: false })

    supabase.auth.onAuthStateChange((_event, s) => {
      const nu = s?.user ?? null
      if (nu) {
        set({ user: { id: nu.id, email: nu.email } })
        void get().loadProfile(nu.id)
      } else {
        set({ user: null, role: null, fullName: null })
      }
    })
  },

  async loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()
    if (data) set({ role: data.role as UserRole, fullName: data.full_name as string })
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const uid = data.user?.id
    if (!uid) return null
    await get().loadProfile(uid)
    return get().role
  },

  async signOut() {
    await supabase.auth.signOut()
    set({ user: null, role: null, fullName: null })
  },
}))
