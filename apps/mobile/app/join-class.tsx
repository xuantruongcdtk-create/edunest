import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth.store'
import { useChildrenStore } from '../stores/children.store'
import { apiFetch } from '../lib/api'
import { AppButton } from '../components/ui'
import { colors, radius, spacing } from '../lib/theme'

interface JoinResult { className: string; classGrade: number; teacherName: string; childName: string }

export default function JoinClass() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const userId = useAuthStore((s) => s.user?.id)
  const { children, activeId, setActive, load } = useChildrenStore()

  const [code, setCode] = useState('')
  const [childId, setChildId] = useState<string | null>(activeId)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (userId && children.length === 0) void load(userId) }, [userId, children.length, load])
  useEffect(() => { if (!childId && activeId) setChildId(activeId) }, [activeId, childId])

  async function join() {
    if (!code.trim()) { Alert.alert('Thiếu mã', 'Nhập mã lớp giáo viên cung cấp.'); return }
    if (!childId) { Alert.alert('Chọn con', 'Chọn con muốn tham gia lớp.'); return }
    setBusy(true)
    try {
      const data = await apiFetch<JoinResult>('/api/v1/classes/join', {
        method: 'POST',
        body: JSON.stringify({ joinCode: code.trim().toUpperCase(), childId }),
      })
      if (userId) await load(userId)
      Alert.alert('Tham gia thành công!', `${data.childName} đã vào lớp ${data.className} (GV: ${data.teacherName}).`, [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Không tham gia được', e?.message ?? 'Vui lòng kiểm tra lại mã lớp.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topbar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
        <Text style={styles.topTitle}>Tham gia lớp</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {children.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>👦</Text>
            <Text style={styles.emptyTitle}>Chưa có hồ sơ con</Text>
            <Text style={styles.muted}>Hãy thêm con trước khi tham gia lớp.</Text>
            <View style={{ height: spacing.md }} />
            <AppButton title="Thêm con" onPress={() => router.replace('/add-child')} />
          </View>
        ) : (
          <>
            <Text style={styles.label}>Mã lớp</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="VD: ABC123"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={styles.label}>Chọn con</Text>
            <View style={styles.childRow}>
              {children.map((c) => {
                const sel = c.id === childId
                return (
                  <Pressable key={c.id} onPress={() => { setChildId(c.id); setActive(c.id) }} style={[styles.childChip, sel && styles.childChipSel]}>
                    <Text style={[styles.childText, sel && { color: '#fff' }]}>{c.full_name}</Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={{ height: spacing.lg }} />
            <AppButton title="Tham gia" onPress={join} loading={busy} />
            <Text style={styles.hint}>Mã lớp do giáo viên tạo và chia sẻ cho phụ huynh.</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLt },
  topTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  body: { padding: spacing.lg, gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: spacing.md, height: 48, fontSize: 16, letterSpacing: 2, color: colors.text, marginTop: spacing.xs },
  childRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  childChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.btn, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  childChipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  childText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: spacing.md },
  empty: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
})
