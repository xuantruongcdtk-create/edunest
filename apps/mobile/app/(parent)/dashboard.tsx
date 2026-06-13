import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/auth.store'
import { useChildrenStore } from '../../stores/children.store'
import { supabase } from '../../lib/supabase'
import { toTen } from '../../lib/format'
import { colors, spacing } from '../../lib/theme'
import {
  Header, Body, Card, StatCard, SectionTitle, EmptyState, Loading, AppButton,
} from '../../components/ui'
import { ChildSwitcher } from '../../components/ChildSwitcher'

interface Stats { avgScore: number | null; avgQuiz: number | null; unread: number }

export default function ParentDashboard() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.user?.id)
  const fullName = useAuthStore((s) => s.fullName)
  const { children, activeId, loaded, load } = useChildrenStore()

  const [stats, setStats] = useState<Stats>({ avgScore: null, avgQuiz: null, unread: 0 })
  const [refreshing, setRefreshing] = useState(false)

  const loadChildren = useCallback(async () => {
    if (userId) await load(userId)
  }, [userId, load])

  const loadStats = useCallback(async (childId: string) => {
    const [scores, attempts, alerts] = await Promise.all([
      supabase.from('score_records').select('score, max_score').eq('child_id', childId),
      supabase.from('quiz_attempts').select('score, max_score').eq('student_id', childId),
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ])
    const sRows = (scores.data ?? []) as { score: number; max_score: number }[]
    const qRows = (attempts.data ?? []) as { score: number; max_score: number }[]
    const avg = (rows: { score: number; max_score: number }[]) =>
      rows.length ? Math.round((rows.reduce((a, r) => a + toTen(r.score, r.max_score), 0) / rows.length) * 10) / 10 : null
    setStats({ avgScore: avg(sRows), avgQuiz: avg(qRows), unread: alerts.count ?? 0 })
  }, [])

  useEffect(() => { void loadChildren() }, [loadChildren])
  useEffect(() => { if (activeId) void loadStats(activeId) }, [activeId, loadStats])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadChildren()
    if (activeId) await loadStats(activeId)
    setRefreshing(false)
  }, [loadChildren, loadStats, activeId])

  if (!loaded) return <><Header title="Tổng quan" /><Loading /></>

  return (
    <>
      <Header title={`Xin chào${fullName ? ', ' + fullName : ''} 👋`} subtitle="Tổng quan việc học của con" />
      <Body refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {children.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
            <EmptyState icon="👦" title="Chưa có hồ sơ con" hint="Thêm con để bắt đầu theo dõi việc học." />
            <View style={{ alignSelf: 'stretch' }}>
              <AppButton title="Thêm con" onPress={() => router.push('/add-child')} />
            </View>
          </Card>
        ) : (
          <>
            <ChildSwitcher />

            <View style={styles.statRow}>
              <StatCard label="Điểm TB" value={stats.avgScore != null ? String(stats.avgScore) : '—'} color={colors.primary} />
              <StatCard label="Điểm quiz TB" value={stats.avgQuiz != null ? String(stats.avgQuiz) : '—'} color={colors.accent} />
            </View>
            <View style={styles.statRow}>
              <StatCard label="Cảnh báo chưa đọc" value={String(stats.unread)} color={stats.unread ? colors.danger : colors.success} />
              <StatCard label="Số con" value={String(children.length)} color={colors.bghBlue} />
            </View>

            <SectionTitle>Hồ sơ con</SectionTitle>
            {children.map((c) => (
              <Card key={c.id} style={styles.childCard}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{c.full_name.charAt(0).toUpperCase()}</Text></View>
                <View>
                  <Text style={styles.childName}>{c.full_name}</Text>
                  <Text style={styles.childGrade}>Lớp {c.grade}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </Body>
    </>
  )
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: spacing.md },
  childCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  avatar: { height: 40, width: 40, borderRadius: 20, backgroundColor: colors.primary + '1A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  childName: { fontSize: 15, fontWeight: '700', color: colors.text },
  childGrade: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
})
