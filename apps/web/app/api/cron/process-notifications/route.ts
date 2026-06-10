import { adminClient, assertNoError } from '@edunest/db'
import { logger } from '@edunest/core'
import { headers } from 'next/headers'

/** Runs every 15 min — fans out pending notifications. */
export async function GET(_req: Request) {
  const headersList = await headers()
  if (headersList.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: pending, error } = await adminClient
    .from('notifications')
    .select('*')
    .eq('status', 'pending')
    .limit(100)
  assertNoError(error)

  // Mark as sent (push channel handling to be wired when Expo tokens available)
  if (pending?.length) {
    await (adminClient as any)
      .from('notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .in('id', pending.map((n: { id: string }) => n.id))
  }

  logger.info('[Cron] process-notifications', { processed: pending?.length ?? 0 })
  return Response.json({ ok: true, processed: pending?.length ?? 0 })
}
