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
    const inAuth = segments[0] === '(auth)'
    const inApp = segments[0] === '(parent)' || segments[0] === '(teacher)'

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login')
      return
    }
    // Logged in: keep parent in parent tabs, teacher in teacher tabs.
    if (!inApp) {
      router.replace(homeFor(role))
    } else if (segments[0] === '(parent)' && role === 'teacher') {
      router.replace('/(teacher)/dashboard')
    } else if (segments[0] === '(teacher)' && role === 'parent') {
      router.replace('/(parent)/dashboard')
    }
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
        </Stack>
      )}
    </SafeAreaProvider>
  )
}
