import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, RefreshControl } from 'react-native'
import { useAuthStore } from '../../stores/auth.store'
import { supabase } from '../../lib/supabase'
import { subjectLabel } from '../../lib/format'
import { colors, spacing } from '../../lib/theme'
import { Header, Body, Card, StatCard, SectionTitle, EmptyState, Loading, Pill } from '../../components/ui'

interface ClassRow { id: string; name: string; student_count: number }
interface QuizRow { id: string; title: string; subject: string; status: string }

const STATUS_VI: Record<string, { label: string; color: string }> = {
  published: { label: 'Đã xuất bản', color: colors.success },
  draft: { label: 'Nháp', color: colors.textFaint },
  archived: { label: 'Lưu trữ', color: colors.warning },
}

export default function TeacherDashboard() {
  const userId = useAuthStore((s) => s.user?.id)
  const fullName = useAuthStore((s) => s.fullName)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [quizzes, setQuizzes] = useState<QuizRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!userId) return
    const [cls, qz] = await Promise.all([
      supabase.from('classes').select('id, name, student_count').eq('teacher_id', userId),
      supabase.from('quizzes').select('id, title, subject, status').eq('teacher_id', userId)
        .order('created_at', { ascending: false }).limit(5),
    ])
    setClasses((cls.data ?? []) as ClassRow[])
    setQuizzes((qz.data ?? []) as QuizRow[])
    setLoading(false)
  }, [userId])

  useEffect(() => { void loadData() }, [loadData])
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false) }, [loadData])

  const studentTotal = classes.reduce((a, c) => a + (c.student_count ?? 0), 0)

  if (loading) return <><Header title="Tổng quan" /><Loading /></>

  return (
    <>
      <Header title={`Xin chào${fullName ? ', ' + fullName : ''} 👋`} subtitle="Tổng quan lớp học của bạn" />
      <Body refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.statRow}>
          <StatCard label="Lớp học" value={String(classes.length)} color={colors.primary} />
          <StatCard label="Học sinh" value={String(studentTotal)} color={colors.bghBlue} />
          <StatCard label="Bài kiểm tra" value={String(quizzes.length)} color={colors.accent} />
        </View>

        <SectionTitle>Lớp của bạn</SectionTitle>
        {classes.length === 0 ? (
          <EmptyState icon="🏫" title="Chưa có lớp" hint="Tạo lớp trên web rồi chia sẻ mã cho phụ huynh." />
        ) : (
          classes.map((c) => (
            <Card key={c.id} style={styles.row}>
              <Text style={styles.className}>{c.name}</Text>
              <Text style={styles.muted}>{c.student_count ?? 0} học sinh</Text>
            </Card>
          ))
        )}

        <SectionTitle>Bài kiểm tra gần đây</SectionTitle>
        {quizzes.length === 0 ? (
          <EmptyState icon="📝" title="Chưa có bài nào" hint="Tạo bài kiểm tra ở tab Bài kiểm tra." />
        ) : (
          quizzes.map((q) => {
            const st = STATUS_VI[q.status] ?? { label: q.status, color: colors.textFaint }
            return (
              <Card key={q.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quizTitle} numberOfLines={1}>{q.title}</Text>
                  <Text style={styles.muted}>{subjectLabel(q.subject)}</Text>
                </View>
                <Pill text={st.label} color={st.color} />
              </Card>
            )
          })
        )}
      </Body>
    </>
  )
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  className: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  quizTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
})
