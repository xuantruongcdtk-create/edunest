import { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth.store'
import { useChildrenStore } from '../stores/children.store'
import { supabase } from '../lib/supabase'
import { AppButton } from '../components/ui'
import { colors, radius, spacing } from '../lib/theme'

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

/** dd/mm/yyyy → yyyy-mm-dd, or null. Returns false if non-empty but invalid. */
function parseDob(s: string): string | null | false {
  const t = s.trim()
  if (!t) return null
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return false
  const [, d, mo, y] = m
  const dd = +d, mm = +mo
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false
  return `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

export default function AddChild() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const userId = useAuthStore((s) => s.user?.id)
  const { children, load } = useChildrenStore()

  const [name, setName] = useState('')
  const [grade, setGrade] = useState<number | null>(null)
  const [dob, setDob] = useState('')
  const [school, setSchool] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!userId) return
    if (!name.trim()) { Alert.alert('Thiếu thông tin', 'Nhập họ tên của con.'); return }
    if (!grade) { Alert.alert('Thiếu thông tin', 'Chọn lớp của con.'); return }
    if (children.length >= 5) { Alert.alert('Giới hạn', 'Tối đa 5 hồ sơ con trên một tài khoản.'); return }
    const dobVal = parseDob(dob)
    if (dobVal === false) { Alert.alert('Ngày sinh không hợp lệ', 'Nhập theo định dạng dd/mm/yyyy.'); return }

    setSaving(true)
    const { error } = await supabase.from('children').insert({
      parent_id: userId,
      full_name: name.trim(),
      grade,
      date_of_birth: dobVal,
      school_name: school.trim() || null,
    } as any)
    setSaving(false)
    if (error) { Alert.alert('Lỗi', 'Không thể thêm con. Thử lại nhé.'); return }
    await load(userId)
    router.back()
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topbar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
        <Text style={styles.topTitle}>Thêm con</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Họ và tên *</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Nguyễn Văn A" placeholderTextColor={colors.textFaint} style={styles.input} />

        <Text style={styles.label}>Lớp *</Text>
        <View style={styles.grades}>
          {GRADES.map((g) => (
            <Pressable key={g} onPress={() => setGrade(g)} style={[styles.gradeChip, grade === g && styles.gradeChipSel]}>
              <Text style={[styles.gradeText, grade === g && { color: '#fff' }]}>{g}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Ngày sinh (tuỳ chọn)</Text>
        <TextInput value={dob} onChangeText={setDob} placeholder="dd/mm/yyyy" placeholderTextColor={colors.textFaint} keyboardType="numbers-and-punctuation" style={styles.input} />

        <Text style={styles.label}>Trường (tuỳ chọn)</Text>
        <TextInput value={school} onChangeText={setSchool} placeholder="Tên trường" placeholderTextColor={colors.textFaint} style={styles.input} />

        <View style={{ height: spacing.lg }} />
        <AppButton title="Lưu" onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLt },
  topTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  body: { padding: spacing.lg, gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: spacing.md, height: 48, fontSize: 15, color: colors.text, marginTop: spacing.xs },
  grades: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  gradeChip: { height: 44, width: 44, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  gradeChipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  gradeText: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
})
