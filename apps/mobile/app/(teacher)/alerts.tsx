import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, RefreshControl, Pressable } from 'react-native'
import type { Alert as AlertRow } from '@edunest/types'
import { useAuthStore } from '../../stores/auth.store'
import { supabase } from '../../lib/supabase'
import { colors, severityColor, spacing } from '../../lib/theme'
import { Header, Body, Card, EmptyState, Loading } from '../../components/ui'

const ALERT_ICON: Record<string, string> = {
  score_drop: '📉', missed_quiz: '⏰', burnout_risk: '🔥', improvement: '📈', goal_reached: '🎯',
}

export default function TeacherAlerts() {
  const userId = useAuthStore((s) => s.user?.id)
  const [items, setItems] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('alerts').select('*').order('created_at', { ascending: false }).limit(50)
    setItems((data ?? []) as AlertRow[])
    setLoading(false)
  }, [userId])

  useEffect(() => { void loadData() }, [loadData])
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false) }, [loadData])

  async function markRead(a: AlertRow) {
    if (a.is_read) return
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_read: true } : x)))
    await supabase.from('alerts').update({ is_read: true }).eq('id', a.id)
  }

  return (
    <>
      <Header title="Cảnh báo" subtitle="Học sinh cần quan tâm" />
      <Body refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState icon="✅" title="Không có cảnh báo" hint="Khi học sinh có dấu hiệu cần chú ý, cảnh báo sẽ hiện ở đây." />
        ) : (
          items.map((a) => {
            const c = severityColor[a.severity] ?? colors.textMuted
            return (
              <Pressable key={a.id} onPress={() => void markRead(a)}>
                <Card style={[styles.row, !a.is_read && { borderColor: c + '55', borderLeftWidth: 3, borderLeftColor: c }]}>
                  <Text style={styles.icon}>{ALERT_ICON[a.type] ?? '🔔'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{a.title}</Text>
                    <Text style={styles.body} numberOfLines={3}>{a.body}</Text>
                    <Text style={styles.date}>{new Date(a.created_at).toLocaleDateString('vi-VN')}</Text>
                  </View>
                  {!a.is_read && <View style={[styles.dot, { backgroundColor: c }]} />}
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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  icon: { fontSize: 22 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  body: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  date: { fontSize: 11, color: colors.textFaint, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
})
