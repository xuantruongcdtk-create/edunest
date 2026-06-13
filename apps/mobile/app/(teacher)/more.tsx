import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/auth.store'
import { colors, radius, spacing } from '../../lib/theme'
import { Header, Body, Card, SectionTitle } from '../../components/ui'

const WEB = process.env.EXPO_PUBLIC_API_URL ?? ''

function LinkRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  )
}

export default function TeacherMore() {
  const { user, fullName, signOut } = useAuthStore()

  function confirmLogout() {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void signOut() },
    ])
  }

  return (
    <>
      <Header title="Thêm" subtitle="Tài khoản & quản lý" />
      <Body>
        <Card style={styles.profile}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(fullName ?? user?.email ?? '?').charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{fullName ?? 'Giáo viên'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </Card>

        <SectionTitle>Quản lý trên web</SectionTitle>
        <Card style={{ padding: 0 }}>
          <LinkRow icon="school-outline" label="Lớp học" onPress={() => Linking.openURL(WEB + '/teacher/classes')} />
          <LinkRow icon="people-outline" label="Học sinh" onPress={() => Linking.openURL(WEB + '/teacher/students')} />
          <LinkRow icon="add-circle-outline" label="Tạo / giao bài kiểm tra" onPress={() => Linking.openURL(WEB + '/teacher/quiz')} />
          <LinkRow icon="link-outline" label="Tham gia trường" onPress={() => Linking.openURL(WEB + '/teacher/join-school')} />
        </Card>

        <View style={{ height: spacing.md }} />
        <Pressable onPress={confirmLogout} style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </Body>
    </>
  )
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { height: 48, width: 48, borderRadius: 24, backgroundColor: colors.primary + '1A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLt },
  linkLabel: { flex: 1, fontSize: 14, color: colors.text },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.btn, borderWidth: 1, borderColor: colors.danger + '40' },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger },
})
