import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '../../stores/auth.store'

export default function Profile() {
  const { user, signOut } = useAuthStore()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hồ sơ cá nhân</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  title:       { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  email:       { color: '#6b7280', marginBottom: 24 },
  signOut:     { backgroundColor: '#E24B4A', borderRadius: 20, padding: 12, alignItems: 'center' },
  signOutText: { color: '#fff', fontWeight: '600' },
})
