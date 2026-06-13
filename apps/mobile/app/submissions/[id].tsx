import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { toTen } from '../../lib/format'
import { Loading, EmptyState } from '../../components/ui'
import { colors, radius, spacing } from '../../lib/theme'

interface Detail { type: 'mcq' | 'essay'; score: number; max: number; correct?: boolean; feedback?: string }
interface Submission {
  id: string
  student_id: string
  student_name: string
  score: number
  max_score: number
  time_taken_seconds: number
  completed_at: string
  details: Detail[] | null
}

export default function Submissions() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [title, setTitle] = useState('Bài đã nộp')
  const [subs, setSubs] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!id) return
    const [{ data: quiz }, { data: attData }] = await Promise.all([
      supabase.from('quizzes').select('title').eq('id', id).single(),
      (supabase as any)
        .from('quiz_attempts')
        .select('id, student_id, score, max_score, time_taken_seconds, completed_at, details')
        .eq('quiz_id', id)
        .order('completed_at', { ascending: false }),
    ])
    if (quiz?.title) setTitle(quiz.title as string)

    const atts = (attData ?? []) as Omit<Submission, 'student_name'>[]
    const ids = Array.from(new Set(atts.map((a) => a.student_id)))
    const nameById: Record<string, string> = {}
    if (ids.length) {
      const { data: kids } = await supabase.from('children').select('id, full_name').in('id', ids)
      for (const c of (kids ?? []) as { id: string; full_name: string }[]) nameById[c.id] = c.full_name
    }
    setSubs(atts.map((a) => ({ ...a, student_name: nameById[a.student_id] ?? 'Học sinh' })))
    setLoading(false)
  }, [id])

  useEffect(() => { void loadData() }, [loadData])
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false) }, [loadData])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.topbar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.text} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle} numberOfLines={1}>Bài đã nộp</Text>
          <Text style={styles.topSub} numberOfLines={1}>{title}</Text>
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {subs.length === 0 ? (
            <EmptyState icon="📭" title="Chưa có bài nộp" hint="Khi học sinh nộp bài, kết quả sẽ hiện ở đây." />
          ) : (
            subs.map((s) => {
              const open = expanded === s.id
              const ten = toTen(s.score, s.max_score)
              return (
                <View key={s.id} style={styles.card}>
                  <Pressable style={styles.cardHead} onPress={() => setExpanded(open ? null : s.id)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{s.student_name}</Text>
                      <Text style={styles.meta}>
                        {new Date(s.completed_at).toLocaleDateString('vi-VN')} · {Math.round(s.time_taken_seconds / 60)} phút
                      </Text>
                    </View>
                    <Text style={styles.score}>{ten}<Text style={styles.scoreMax}>/10</Text></Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textFaint} />
                  </Pressable>

                  {open && (
                    <View style={styles.details}>
                      {(s.details ?? []).map((d, i) => (
                        <View key={i} style={styles.detailRow}>
                          <Text style={styles.detailQ}>Câu {i + 1}</Text>
                          {d.type === 'mcq' ? (
                            <Text style={{ color: d.correct ? colors.success : colors.danger, fontWeight: '700', fontSize: 13 }}>
                              {d.correct ? '✓ Đúng' : '✗ Sai'}
                            </Text>
                          ) : (
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>Tự luận: {d.score}/{d.max}</Text>
                              {d.feedback ? <Text style={styles.feedback}>{d.feedback}</Text> : null}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )
            })
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLt },
  topTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  topSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.borderLt, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  score: { fontSize: 20, fontWeight: '800', color: colors.primary },
  scoreMax: { fontSize: 12, fontWeight: '600', color: colors.textFaint },
  details: { borderTopWidth: 1, borderTopColor: colors.borderLt, padding: spacing.md, gap: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  detailQ: { fontSize: 13, fontWeight: '700', color: colors.text, width: 56 },
  feedback: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
})
