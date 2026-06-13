import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useChildrenStore } from '../stores/children.store'
import { colors, radius, spacing } from '../lib/theme'

/** Horizontal chips to switch the active child. Hidden if there is 0–1 child. */
export function ChildSwitcher() {
  const { children, activeId, setActive } = useChildrenStore()
  if (children.length <= 1) return null

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {children.map((c) => {
        const active = c.id === activeId
        return (
          <Pressable
            key={c.id}
            onPress={() => setActive(c.id)}
            style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
          >
            <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextIdle]}>
              {c.full_name}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.btn, borderWidth: 1 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipIdle: { backgroundColor: colors.card, borderColor: colors.border },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  chipTextIdle: { color: colors.textMuted },
})
