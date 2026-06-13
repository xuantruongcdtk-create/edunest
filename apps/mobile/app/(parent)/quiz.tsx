import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, RefreshControl, Alert, Pressable } from 'react-native'
import { useAuthStore } from '../../stores/auth.store'
import { useChildrenStore } from '../../stores/children.store'
import { supabase } from '../../lib/supabase'
import { subjectLabel } from '../../lib/format'
import { colors, spacing } from '../../lib/theme'
import { Header, Body, Card, EmptyState, Loading, Pill } from '../../components/ui'
import { ChildSwitcher } from '../../components/ChildSwitcher'

interface AssignedQuiz {
  id: string
  title: string
  subject: string
  timeLimit: number
  dueDate: string | null
  done: boolean
}

export default function ParentQuiz() {
  const userId = useAuthStore((s) => s.user?.id)
  const { activeId, loaded, load } = useChildrenStore()
  const [items, setItems] = useState<AssignedQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async (childId: string) => {
    // child → classes → assignments → quizzes (RLS: parent_can_access_quiz)
    const { data: memberships } = await supabase
      .from('class_memberships').select('class_id').eq('child_id', childId)
    const classIds = (memberships ?? []).map((m: any) => m.class_id)
    if (classIds.length === 0) { setItems([]); setLoading(false); return }

    const { data: assignments } = await supabase
      .from('quiz_assignments').select('quiz_id, due_date').in('class_id', classIds)
    const assignMap = new Map<string, string | null>()
    ;(assignments ?? []).forEach((a: any) => assignMap.set(a.quiz_id, a.due_date))
    const quizIds = [...assignMap.keys()]
    if (quizIds.length === 0) { setItems([]); setLoading(false); return }

    const [{ data: quizzes }, { data: attempts }] = await Promise.all([
      supabase.from('quizzes').select('id, title, subject, time_limit_minutes').in('id', quizIds),
      supabase.from('quiz_attempts').select('quiz_id').eq('student_id', childId).in('quiz_id', quizIds),
    ])
    const doneSet = new Set((attempts ?? []).map((a: any) => a.quiz_id))
    setItems((quizzes ?? []).map((q: any) => ({
      id: q.id,
      title: q.title,
      subject: q.subject,
      timeLimit: q.time_limit_minutes,
      dueDate: assignMap.get(q.id) ?? null,
      done: doneSet.has(q.id),
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
    setRefreshing(true); await loadData(activeId); setRefreshing(false)
  }, [activeId, loadData])

  function statusPill(q: AssignedQuiz) {
    if (q.done) return <Pill text="Đã làm" color={colors.success} />
    if (q.dueDate && new Date(q.dueDate) < new Date()) return <Pill text="Hết hạn" color={colors.danger} />
    return <Pill text="Chưa làm" color={colors.warning} />
  }

  return (
    <>
      <Header title="Bài kiểm tra" subtitle="Bài giáo viên giao cho con" />
      <Body refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <ChildSwitcher />
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState icon="📝" title="Chưa có bài nào" hint="Khi con tham gia lớp và giáo viên giao bài, bài sẽ hiện ở đây." />
        ) : (
          items.map((q) => (
            <Pressable
              key={q.id}
              onPress={() => Alert.alert(q.title, q.done
                ? 'Con đã hoàn thành bài này. Xem điểm ở tab Bảng điểm.'
                : 'Làm bài kiểm tra sẽ sớm có trên app. Hiện tại con có thể làm bài trên bản web.')}
            >
              <Card style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{q.title}</Text>
                  <Text style={styles.meta}>
                    {subjectLabel(q.subject)} · {q.timeLimit} phút
                    {q.dueDate ? ` · Hạn ${new Date(q.dueDate).toLocaleDateString('vi-VN')}` : ''}
                  </Text>
                </View>
                {statusPill(q)}
              </Card>
            </Pressable>
          ))
        )}
      </Body>
    </>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
})
