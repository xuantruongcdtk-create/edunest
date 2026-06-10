import { verifyVnpayReturn } from '@edunest/services'
import { adminClient } from '@edunest/db'
import { logger } from '@edunest/core'

const PLAN_MONTHS: Record<string, number> = { basic: 1, pro: 1, school: 12 }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = Object.fromEntries(searchParams.entries())

  if (!verifyVnpayReturn(query)) {
    logger.warn('[VNPAY webhook] Invalid secure hash', { txnRef: query.vnp_TxnRef })
    return new Response('Forbidden', { status: 403 })
  }

  if (query.vnp_ResponseCode === '00') {
    const { data: tx, error: txErr } = await adminClient
      .from('payment_transactions')
      .update({ status: 'success', metadata: query })
      .eq('provider_tx_id', query.vnp_TxnRef)
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

    logger.info('[VNPAY webhook] Payment confirmed', { txnRef: query.vnp_TxnRef })
  } else {
    await adminClient
      .from('payment_transactions')
      .update({ status: 'failed', metadata: query })
      .eq('provider_tx_id', query.vnp_TxnRef)

    logger.warn('[VNPAY webhook] Payment failed', { txnRef: query.vnp_TxnRef, code: query.vnp_ResponseCode })
  }

  return new Response('OK', { status: 200 })
}
