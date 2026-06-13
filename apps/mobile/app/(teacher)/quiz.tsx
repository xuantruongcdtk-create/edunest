import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, RefreshControl, Pressable, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/auth.store'
import { supabase } from '../../lib/supabase'
import { subjectLabel } from '../../lib/format'
import { colors, spacing } from '../../lib/theme'
import { Header, Body, Card, EmptyState, Loading, Pill } from '../../components/ui'

interface QuizRow { id: string; title: string; subject: string; status: string; question_count: number }

const STATUS_VI: Record<string, { label: string; color: string }> = {
  published: { label: 'Đã xuất bản', color: colors.success },
  draft: { label: 'Nháp', color: colors.textFaint },
  archived: { label: 'Lưu trữ', color: colors.warning },
}
const WEB = process.env.EXPO_PUBLIC_API_URL ?? ''

export default function TeacherQuiz() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.user?.id)
  const [items, setItems] = useState<QuizRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('quizzes').select('id, title, subject, status, question_count')
      .eq('teacher_id', userId).order('created_at', { ascending: false })
    setItems((data ?? []) as QuizRow[])
    setLoading(false)
  }, [userId])

  useEffect(() => { void loadData() }, [loadData])
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false) }, [loadData])

  return (
    <>
      <Header
        title="Bài kiểm tra"
        subtitle="Đề bạn đã tạo"
        right={
          <Pressable onPress={() => Linking.openURL(WEB + '/teacher/quiz')} style={styles.addBtn}>
            <Text style={styles.addText}>+ Tạo</Text>
          </Pressable>
        }
      />
      <Body refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState icon="📝" title="Chưa có bài nào" hint="Bấm '+ Tạo' để tạo quiz bằng AI hoặc tải đề lên trên web." />
        ) : (
          items.map((q) => {
            const st = STATUS_VI[q.status] ?? { label: q.status, color: colors.textFaint }
            return (
              <Pressable key={q.id} onPress={() => router.push(`/submissions/${q.id}`)}>
                <Card style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={2}>{q.title}</Text>
                    <Text style={styles.meta}>{subjectLabel(q.subject)} · {q.question_count} câu · Xem bài nộp ›</Text>
                  </View>
                  <Pill text={st.label} color={st.color} />
                </Card>
              </Pressable>
            )
          })
        )}
      </Body>
    </>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
})
