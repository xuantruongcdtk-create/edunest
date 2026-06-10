import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const PRIMARY = '#1D9E75'

export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   PRIMARY,
        tabBarInactiveTintColor: '#9ca3af',
        headerShown:             false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:    'Trang chủ',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title:    'Bài tập',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title:    'Xếp hạng',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title:    'Cá nhân',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
