import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../stores/auth.store'
import { Loading } from '../components/ui'

function homeFor(role: string | null): string {
  return role === 'teacher' ? '/(teacher)/dashboard' : '/(parent)/dashboard'
}

/** Redirects between the auth flow and the role tabs based on session + role. */
function useAuthGate() {
  const { user, role, loading } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const seg0 = segments[0]
    const inAuth = seg0 === '(auth)'
    const atRoot = seg0 === undefined // the index route

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login')
      return
    }
    // Logged in: send away from the login/index landing; keep each role in its own tabs.
    if (inAuth || atRoot) {
      router.replace(homeFor(role))
    } else if (seg0 === '(parent)' && role === 'teacher') {
      router.replace('/(teacher)/dashboard')
    } else if (seg0 === '(teacher)' && role === 'parent') {
      router.replace('/(parent)/dashboard')
    }
    // Other routes (e.g. quiz/[id]) are left alone for logged-in users.
  }, [user, role, loading, segments, router])
}

export default function RootLayout() {
  const init = useAuthStore((s) => s.init)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => { void init() }, [init])
  useAuthGate()

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {loading ? (
        <Loading label="Đang tải EduNest…" />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="quiz/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="submissions/[id]" />
          <Stack.Screen name="add-child" options={{ presentation: 'modal' }} />
          <Stack.Screen name="join-class" options={{ presentation: 'modal' }} />
        </Stack>
      )}
    </SafeAreaProvider>
  )
}
