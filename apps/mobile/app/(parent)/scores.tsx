import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, RefreshControl } from 'react-native'
import { useAuthStore } from '../../stores/auth.store'
import { useChildrenStore } from '../../stores/children.store'
import { supabase } from '../../lib/supabase'
import { subjectLabel, toTen } from '../../lib/format'
import { colors, radius, spacing } from '../../lib/theme'
import { Header, Body, Card, SectionTitle, EmptyState, Loading } from '../../components/ui'
import { ChildSwitcher } from '../../components/ChildSwitcher'

interface SubjAvg { subject: string; avg: number }
interface QuizResult { id: string; score: number; max_score: number; completed_at: string; title: string; subject: string }

export default function ParentScores() {
  const userId = useAuthStore((s) => s.user?.id)
  const { activeId, loaded, load } = useChildrenStore()

  const [subjects, setSubjects] = useState<SubjAvg[]>([])
  const [quizzes, setQuizzes] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async (childId: string) => {
    const [scores, attempts] = await Promise.all([
      supabase.from('score_records').select('subject, score, max_score').eq('child_id', childId),
      supabase
        .from('quiz_attempts')
        .select('id, score, max_score, completed_at, quiz:quiz_id(title, subject)')
        .eq('student_id', childId)
        .order('completed_at', { ascending: false })
        .limit(20),
    ])

    const rows = (scores.data ?? []) as { subject: string; score: number; max_score: number }[]
    const bySubj = new Map<string, number[]>()
    rows.forEach((r) => {
      const arr = bySubj.get(r.subject) ?? []
      arr.push(toTen(r.score, r.max_score))
      bySubj.set(r.subject, arr)
    })
    setSubjects([...bySubj.entries()].map(([subject, vals]) => ({
      subject,
      avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
    })))

    const qrows = (attempts.data ?? []) as any[]
    setQuizzes(qrows.map((q) => ({
      id: q.id,
      score: q.score,
      max_score: q.max_score,
      completed_at: q.completed_at,
      title: q.quiz?.title ?? 'Bài kiểm tra',
      subject: q.quiz?.subject ?? '',
    })))
    setLoading(false)
  }, [])

  useEffect(() => { if (userId) void load(userId) }, [userId, load])
  useEffect(() => {
    if (activeId) { setLoading(true); void loadData(activeId) }
    else if (loaded) setLoading(false)
  }, [activeId, loaded, loadData])

  const onRefresh = useCallback(async () => {
    if (!activeId) return
    setRefreshing(true)
    await loadData(activeId)
    setRefreshing(false)
  }, [activeId, loadData])

  return (
    <>
      <Header title="Bảng điểm" subtitle="Điểm theo môn và kết quả bài kiểm tra" />
      <Body refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <ChildSwitcher />

        {loading ? (
          <Loading />
        ) : !activeId ? (
          <EmptyState icon="👦" title="Chưa có hồ sơ con" hint="Thêm con ở mục Thêm để xem điểm." />
        ) : (
          <>
            <SectionTitle>Điểm trung bình theo môn</SectionTitle>
            {subjects.length === 0 ? (
              <EmptyState icon="📊" title="Chưa có điểm" hint="Điểm nhập tay sẽ hiển thị tại đây." />
            ) : (
              <Card>
                {subjects.map((s, i) => (
                  <View key={s.subject} style={[styles.barRow, i > 0 && { marginTop: spacing.md }]}>
                    <Text style={styles.subjName}>{subjectLabel(s.subject)}</Text>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${Math.min(s.avg * 10, 100)}%` }]} />
                    </View>
                    <Text style={styles.subjVal}>{s.avg}</Text>
                  </View>
                ))}
              </Card>
            )}

            <SectionTitle>Kết quả quiz gần đây</SectionTitle>
            {quizzes.length === 0 ? (
              <EmptyState icon="📝" title="Chưa làm bài nào" hint="Bài kiểm tra giáo viên giao sẽ xuất hiện ở tab Bài kiểm tra." />
            ) : (
              quizzes.map((q) => (
                <Card key={q.id} style={styles.quizCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quizTitle} numberOfLines={1}>{q.title}</Text>
                    <Text style={styles.quizMeta}>
                      {subjectLabel(q.subject)} · {new Date(q.completed_at).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <Text style={styles.quizScore}>{toTen(q.score, q.max_score)}<Text style={styles.quizScoreMax}>/10</Text></Text>
                </Card>
              ))
            )}
          </>
        )}
      </Body>
    </>
  )
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  subjName: { width: 48, fontSize: 13, color: colors.textMuted },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.borderLt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  subjVal: { width: 32, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.text },
  quizCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  quizTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  quizMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  quizScore: { fontSize: 20, fontWeight: '800', color: colors.primary },
  quizScoreMax: { fontSize: 12, fontWeight: '600', color: colors.textFaint },
})
