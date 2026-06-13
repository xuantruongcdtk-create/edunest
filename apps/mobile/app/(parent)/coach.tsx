import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/auth.store'
import { supabase } from '../../lib/supabase'
import { apiFetch } from '../../lib/api'
import { Header, Loading } from '../../components/ui'
import { colors, radius, spacing } from '../../lib/theme'

interface Msg { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Con tôi nên cải thiện môn nào?',
  'Làm sao giúp con bớt căng thẳng khi học?',
  'Gợi ý kế hoạch học tuần này cho con.',
]

export default function Coach() {
  const userId = useAuthStore((s) => s.user?.id)
  const [messages, setMessages] = useState<Msg[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    async function loadHistory() {
      if (!userId) return
      const { data } = await supabase
        .from('coach_conversations')
        .select('id, messages')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        setConversationId(data.id as string)
        const msgs = ((data.messages ?? []) as Msg[]).map((m) => ({ role: m.role, content: m.content }))
        setMessages(msgs)
      }
      setLoading(false)
    }
    void loadHistory()
  }, [userId])

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))
  }, [])

  const send = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || sending) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setSending(true)
    scrollToEnd()
    try {
      const data = await apiFetch<{ conversationId: string; reply: string }>('/api/v1/coach', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId: conversationId ?? undefined, stream: false }),
      })
      setConversationId(data.conversationId)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e: any) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `⚠️ ${e?.message ?? 'Không gửi được. Vui lòng thử lại.'}`,
      }])
    } finally {
      setSending(false)
      scrollToEnd()
    }
  }, [conversationId, sending, scrollToEnd])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Header title="EduCoach AI" subtitle="Trợ lý học tập cho con" />

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.chat}
          onContentSizeChange={scrollToEnd}
        >
          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <Text style={{ fontSize: 40 }}>🤖</Text>
              <Text style={styles.welcomeTitle}>Xin chào! Tôi là EduCoach.</Text>
              <Text style={styles.welcomeHint}>Hỏi tôi bất cứ điều gì về việc học của con.</Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} onPress={() => void send(s)} style={styles.suggestion}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m, i) => (
              <View
                key={i}
                style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}
              >
                <Text style={m.role === 'user' ? styles.textUser : styles.textAi}>{m.content}</Text>
              </View>
            ))
          )}
          {sending && (
            <View style={[styles.bubble, styles.bubbleAi, styles.typing]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.typingText}>EduCoach đang trả lời…</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập câu hỏi…"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          multiline
          editable={!sending}
          onSubmitEditing={() => void send(input)}
        />
        <Pressable
          onPress={() => void send(input)}
          disabled={sending || !input.trim()}
          style={[styles.sendBtn, (sending || !input.trim()) && { opacity: 0.5 }]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  chat: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
  welcome: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  welcomeTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  welcomeHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  suggestions: { marginTop: spacing.lg, gap: spacing.sm, alignSelf: 'stretch' },
  suggestion: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md },
  suggestionText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  bubble: { maxWidth: '85%', borderRadius: radius.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleAi: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLt },
  textUser: { color: '#fff', fontSize: 14, lineHeight: 20 },
  textAi: { color: colors.text, fontSize: 14, lineHeight: 20 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typingText: { color: colors.textMuted, fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.sm, paddingHorizontal: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLt, backgroundColor: colors.card,
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 40, backgroundColor: colors.bg,
    borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 14, color: colors.text,
  },
  sendBtn: { height: 40, width: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
})
