import { View, Text, StyleSheet } from 'react-native'
import { useAuthStore } from '../../stores/auth.store'

export default function StudentHome() {
  const user = useAuthStore((s) => s.user)

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Xin chào, {user?.email ?? 'bạn'} 👋</Text>
      {/* TODO: upcoming quizzes, recent scores, streaks */}
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  greeting:   { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 12 },
})
