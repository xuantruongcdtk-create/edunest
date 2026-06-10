import { adminClient, assertNoError } from '@edunest/db'
import { logger } from '@edunest/core'
import { headers } from 'next/headers'

/** Runs daily at 00:05 ICT — downgrades profiles with expired plans. */
export async function GET(_req: Request) {
  const headersList = await headers()
  if (headersList.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date().toISOString()
  const { data, error } = await adminClient
    .from('profiles')
    .update({ plan_tier: 'free', plan_status: 'expired' })
    .lt('plan_expires_at', now)
    .neq('plan_tier', 'free')
    .select('id')
  assertNoError(error)

  logger.info('[Cron] expire-plans done', { expired: data?.length ?? 0 })
  return Response.json({ ok: true, expired: data?.length ?? 0 })
}
