import { View, Text, StyleSheet, FlatList } from 'react-native'

export default function QuizList() {
  // TODO: fetch assigned quizzes from /api/v1/quiz
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bài tập được giao</Text>
      {/* TODO: <QuizCard /> list */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  title:     { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
})
