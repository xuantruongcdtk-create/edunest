import { View, Text, StyleSheet } from 'react-native'

export default function Leaderboard() {
  // TODO: fetch leaderboard from API
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bảng xếp hạng 🏆</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  title:     { fontSize: 20, fontWeight: '700', color: '#111827' },
})
