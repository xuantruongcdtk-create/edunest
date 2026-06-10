import { getServerClient, assertNoError } from '@edunest/db'
import { checkAIRateLimit, createCoachStream } from '@edunest/ai'
import type { CoachConversation, CoachMessage } from '@edunest/types'
import { NotFoundError } from '@edunest/core'

const SYSTEM_PROMPT = `Bạn là EduCoach — trợ lý AI giáo dục của EduNest, chuyên hỗ trợ phụ huynh Việt Nam
theo dõi và cải thiện kết quả học tập của con. Trả lời bằng tiếng Việt, ngắn gọn và thực tiễn.
Không đưa ra lời khuyên y tế hoặc pháp lý. Nếu không chắc, hãy khuyên liên hệ giáo viên trực tiếp.`

export async function getOrCreateConversation(
  userId: string,
  childId?: string,
): Promise<CoachConversation> {
  const db = await getServerClient()

  let query = db.from('coach_conversations').select('*').eq('user_id', userId)
  if (childId) query = query.eq('child_id', childId)
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).single()

  if (error && error.code === 'PGRST116') {
    // Create new conversation
    const { data: created, error: ce } = await (db as any)
      .from('coach_conversations')
      .insert({ user_id: userId, child_id: childId ?? null, messages: [] })
      .select()
      .single()
    assertNoError(ce)
    return created as CoachConversation
  }

  assertNoError(error)
  return data as CoachConversation
}

export async function* streamCoachReply(
  userId: string,
  conversationId: string,
  userMessage: string,
): AsyncGenerator<string> {
  await checkAIRateLimit(userId, 'coach')

  const db = await getServerClient()
  const { data: conv, error } = await db
    .from('coach_conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()
  assertNoError(error)
  if (!conv) throw new NotFoundError('CoachConversation', conversationId)

  // Map stored messages to Gemini Content format
  const history = ((conv as CoachConversation).messages ?? []).map((m: CoachMessage) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const geminiStream = await createCoachStream(history, SYSTEM_PROMPT, userMessage)
  let assistantText = ''

  for await (const chunk of geminiStream.stream) {
    const text = chunk.text()
    if (text) {
      assistantText += text
      yield text
    }
  }

  // Persist both turns
  const newMessages: CoachMessage[] = [
    ...((conv as CoachConversation).messages ?? []),
    { role: 'user',      content: userMessage,   created_at: new Date().toISOString() },
    { role: 'assistant', content: assistantText, created_at: new Date().toISOString() },
  ]

  await (db as any)
    .from('coach_conversations')
    .update({ messages: newMessages, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
}
