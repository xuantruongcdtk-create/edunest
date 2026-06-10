'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { cn } from '../../lib/cn'

interface Message { role: 'user' | 'assistant'; content: string }

interface CoachChatProps {
  childId?:    string
  childName?:  string
  className?:  string
}

export const CoachChat = forwardRef<HTMLDivElement, CoachChatProps>(
  ({ childId, childName, className }, ref) => {
    const [messages,    setMessages]    = useState<Message[]>([])
    const [input,       setInput]       = useState('')
    const [loading,     setLoading]     = useState(false)
    const [convId,      setConvId]      = useState<string>()
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function sendMessage() {
      if (!input.trim() || loading) return
      const userMsg = input.trim()
      setInput('')
      setMessages((m) => [...m, { role: 'user', content: userMsg }])
      setLoading(true)

      let assistantText = ''
      setMessages((m) => [...m, { role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/v1/coach', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ message: userMsg, conversationId: convId, childId }),
        })

        if (!res.ok) {
          const errText = await res.text()
          setMessages((m) => [
            ...m.slice(0, -1),
            { role: 'assistant', content: `Xin lỗi, có lỗi xảy ra (${res.status}). Vui lòng thử lại.` },
          ])
          console.error('Coach API error:', res.status, errText)
          return
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        while (reader) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
          for (const line of lines) {
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') break
            try {
              const parsed = JSON.parse(payload) as { text: string }
              assistantText += parsed.text
              setMessages((m) => [
                ...m.slice(0, -1),
                { role: 'assistant', content: assistantText },
              ])
            } catch { /* skip malformed chunks */ }
          }
        }
        if (!assistantText) {
          setMessages((m) => [
            ...m.slice(0, -1),
            { role: 'assistant', content: 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.' },
          ])
        }
      } catch (err) {
        console.error('Coach fetch error:', err)
        setMessages((m) => [
          ...m.slice(0, -1),
          { role: 'assistant', content: 'Mất kết nối. Vui lòng kiểm tra mạng và thử lại.' },
        ])
      } finally {
        setLoading(false)
      }
    }

    const suggestions = childName
      ? [
          `${childName} học môn nào tốt nhất?`,
          'Làm sao để cải thiện điểm Toán?',
          'Con có dấu hiệu kiệt sức không?',
          'Lên kế hoạch ôn thi cuối kỳ',
        ]
      : []

    return (
      <div
        ref={ref}
        className={cn('flex flex-col h-full bg-white rounded-card shadow-card', className)}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-400 text-center">
                Hỏi EduCoach bất cứ điều gì về việc học của con 👋
              </p>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setInput(q)}
                      className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-chip cursor-pointer hover:border-primary hover:text-primary transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm',
                )}
              >
                {m.content || (loading && <span className="animate-pulse">▍</span>)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Nhập câu hỏi…"
            disabled={loading}
            className="flex-1 rounded-input border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="h-9 w-9 rounded-btn bg-primary text-white flex items-center justify-center disabled:opacity-40"
            aria-label="Gửi"
          >
            <span aria-hidden>↑</span>
          </button>
        </div>
      </div>
    )
  },
)
CoachChat.displayName = 'CoachChat'
