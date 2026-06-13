import { type ReactNode } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable,
  ScrollView, type ViewStyle, type StyleProp,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, spacing } from '../lib/theme'

/** Page header bar with a title + optional subtitle, respecting the status bar inset. */
export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  )
}

/** Scrollable content area below a Header. */
export function Body({ children, refreshControl }: { children: ReactNode; refreshControl?: ReactNode }) {
  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={styles.bodyContent}
      refreshControl={refreshControl as any}
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function StatCard({ label, value, color = colors.primary }: { label: string; value: string; color?: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: color + '14' }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

export function Pill({ text, color = colors.primary }: { text: string; color?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '14' }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  )
}

export function AppButton({
  title, onPress, variant = 'primary', disabled, loading,
}: { title: string; onPress: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean; loading?: boolean }) {
  const isGhost = variant === 'ghost'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isGhost ? styles.btnGhost : styles.btnPrimary,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading
        ? <ActivityIndicator color={isGhost ? colors.primary : '#fff'} />
        : <Text style={[styles.btnText, isGhost ? { color: colors.primary } : { color: '#fff' }]}>{title}</Text>}
    </Pressable>
  )
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Text style={styles.muted}>{label}</Text> : null}
    </View>
  )
}

export function EmptyState({ icon = '📭', title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.muted}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  body: { flex: 1, backgroundColor: colors.bg },
  bodyContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },

  stat: { flex: 1, borderRadius: radius.card, padding: spacing.md },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: spacing.sm },

  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '700' },

  btn: { height: 48, borderRadius: radius.btn, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnText: { fontSize: 15, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: spacing.md },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2, gap: spacing.sm },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
})
