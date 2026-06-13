import { getAuthUser } from '@edunest/db'
import { getOrCreateConversation, streamCoachReply } from '@edunest/services'
import { UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const MessageSchema = z.object({
  message:        z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
  childId:        z.string().uuid().optional(),
  // Mobile sets stream:false to get a single JSON reply (RN fetch can't read SSE).
  stream:         z.boolean().optional(),
})

export async function POST(req: Request) {
  // Validate required env vars up-front
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GOOGLE_AI_API_KEY chưa được cấu hình' }), { status: 500 })
  }
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return new Response(JSON.stringify({ error: 'UPSTASH_REDIS_REST_URL chưa được cấu hình' }), { status: 500 })
  }

  try {
    const user = await getAuthUser()
    if (!user) throw new UnauthorizedError()

    const body   = await req.json()
    const parsed = MessageSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

    const conv = parsed.data.conversationId
      ? { id: parsed.data.conversationId }
      : await getOrCreateConversation(user.id, parsed.data.childId)

    // Non-streaming JSON reply (mobile): collect the whole reply, return the API envelope.
    if (parsed.data.stream === false) {
      try {
        let reply = ''
        for await (const chunk of streamCoachReply(user.id, conv.id, parsed.data.message)) {
          reply += chunk
        }
        return Response.json({ ok: true, data: { conversationId: conv.id, reply } })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return Response.json({ ok: false, error: { code: 'COACH_ERROR', message } }, { status: 400 })
      }
    }

    // Stream SSE back to the client
    const encoder = new TextEncoder()
    const stream  = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamCoachReply(user.id, conv.id, parsed.data.message)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          console.error('[coach] stream error:', err)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (err) {
    console.error('[coach] route error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
