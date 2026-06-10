import { verifyMomoWebhook } from '@edunest/services'
import { adminClient, assertNoError } from '@edunest/db'
import { logger } from '@edunest/core'

const PLAN_MONTHS: Record<string, number> = { basic: 1, pro: 1, school: 12 }

export async function POST(req: Request) {
  const body      = await req.json() as Record<string, string>
  const signature = body.signature ?? ''

  if (!verifyMomoWebhook(body, signature)) {
    logger.warn('[MoMo webhook] Invalid signature', { orderId: body.orderId })
    return new Response('Forbidden', { status: 403 })
  }

  if (body.resultCode === '0') {
    const { data: tx, error: txErr } = await adminClient
      .from('payment_transactions')
      .update({ status: 'success', metadata: body })
      .eq('provider_tx_id', body.orderId)
      .eq('status', 'pending')
      .select('user_id, plan_tier')
      .single()

    if (!txErr && tx) {
      const { user_id, plan_tier } = tx as { user_id: string; plan_tier: string }
      const months = PLAN_MONTHS[plan_tier] ?? 1
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + months)

      await adminClient.from('profiles').update({
        plan_tier,
        plan_status:     'active',
        plan_expires_at: expiresAt.toISOString(),
      }).eq('id', user_id)
    }

    logger.info('[MoMo webhook] Payment confirmed', { orderId: body.orderId })
  } else {
    await adminClient
      .from('payment_transactions')
      .update({ status: 'failed', metadata: body })
      .eq('provider_tx_id', body.orderId)

    logger.warn('[MoMo webhook] Payment failed', { orderId: body.orderId, code: body.resultCode })
  }

  return new Response('OK', { status: 200 })
}
