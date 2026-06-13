import { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../stores/auth.store'
import { AppButton } from '../../components/ui'
import { colors, radius, spacing } from '../../lib/theme'

export default function Login() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const signIn = useAuthStore((s) => s.signIn)
  const signOut = useAuthStore((s) => s.signOut)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.')
      return
    }
    setBusy(true)
    try {
      const role = await signIn(email.trim(), password)
      if (role === 'teacher') {
        router.replace('/(teacher)/dashboard')
      } else if (role === 'parent') {
        router.replace('/(parent)/dashboard')
      } else {
        await signOut()
        Alert.alert(
          'Chưa hỗ trợ',
          'App di động hiện chỉ dành cho phụ huynh và giáo viên. Vui lòng dùng bản web.',
        )
      }
    } catch (e: any) {
      Alert.alert('Đăng nhập thất bại', e?.message ?? 'Email hoặc mật khẩu không đúng.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.logo}>🎓 EduNest</Text>
        <Text style={styles.tagline}>Theo dõi việc học của con thông minh hơn</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            style={styles.input}
          />

          <View style={{ height: spacing.md }} />
          <AppButton title="Đăng nhập" onPress={handleLogin} loading={busy} />

          <Text style={styles.hint}>
            Chưa có tài khoản?{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL((process.env.EXPO_PUBLIC_API_URL ?? '') + '/register')}
            >
              Đăng ký trên web
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: spacing.xl },
  logo: { fontSize: 30, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  tagline: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  form: { marginTop: spacing.xl * 1.5, gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 15,
    color: colors.text,
    marginTop: spacing.xs,
  },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  link: { color: colors.primary, fontWeight: '700' },
})
