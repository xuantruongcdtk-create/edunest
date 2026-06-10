import { create } from 'zustand'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const supabase = createClient(
  Constants.expoConfig?.extra?.supabaseUrl  ?? '',
  Constants.expoConfig?.extra?.supabaseAnon ?? '',
  {
    auth: {
      storage: {
        async getItem(key)        { return SecureStore.getItemAsync(key) },
        async setItem(key, value) { await SecureStore.setItemAsync(key, value) },
        async removeItem(key)     { await SecureStore.deleteItemAsync(key) },
      },
      autoRefreshToken:  true,
      persistSession:    true,
      detectSessionInUrl: false,
    },
  },
)

interface User { id: string; email?: string }

interface AuthState {
  user:    User | null
  loading: boolean
  signIn:  (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  init:    () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  loading: true,

  async init() {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },

  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  async signOut() {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
