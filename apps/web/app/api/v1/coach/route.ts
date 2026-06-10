import { getServerClient } from '@edunest/db'
import { getOrCreateConversation, streamCoachReply } from '@edunest/services'
import { apiError, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const MessageSchema = z.object({
  message:        z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
  childId:        z.string().uuid().optional(),
})

export async function POST(req: Request) {
  try {
    const db = await getServerClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body   = await req.json()
    const parsed = MessageSchema.safeParse(body)
    if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

    const conv = parsed.data.conversationId
      ? { id: parsed.data.conversationId }
      : await getOrCreateConversation(user.id, parsed.data.childId)

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
          controller.error(err)
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
    return apiError(err)
  }
}
