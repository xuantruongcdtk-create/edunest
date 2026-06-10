import { randomBytes } from 'crypto'
import { getServerClient } from '@edunest/db'
import { createMomoPayment } from '@edunest/services'
import { ok, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const Schema = z.object({
  planTier: z.enum(['basic', 'pro', 'school']),
})

const PRICES: Record<string, number> = { basic: 99000, pro: 199000, school: 990000 }

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const body   = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL!
  const orderId   = `EDN-${randomBytes(6).toString('hex').toUpperCase()}`
  const amountVnd = PRICES[parsed.data.planTier]!

  // Record transaction before redirecting
  await db.from('payment_transactions').insert({
    user_id:        user.id,
    provider:       'momo',
    provider_tx_id: orderId,
    amount_vnd:     amountVnd,
    plan_tier:      parsed.data.planTier,
    status:         'pending',
  })

  const result = await createMomoPayment({
    orderId,
    userId:      user.id,
    planTier:    parsed.data.planTier,
    amountVnd,
    redirectUrl: `${appUrl}/payment/result`,
    ipnUrl:      `${appUrl}/api/webhooks/momo`,
  })

  return ok(result)
})
