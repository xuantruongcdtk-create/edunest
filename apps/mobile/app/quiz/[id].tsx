import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'

export default function QuizGameplay() {
  const { id }  = useLocalSearchParams<{ id: string }>()
  const router  = useRouter()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers]  = useState<number[]>([])

  // TODO: fetch quiz questions from /api/v1/quiz/:id, render question + 4 options
  // On last question → POST /api/v1/quiz/attempt → show score screen

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bài Quiz #{id}</Text>
      <Text style={styles.sub}>Câu {current + 1} / ?</Text>
      {/* TODO: question + option buttons */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title:     { fontSize: 20, fontWeight: '700', color: '#111827' },
  sub:       { color: '#6b7280', marginTop: 4 },
})
