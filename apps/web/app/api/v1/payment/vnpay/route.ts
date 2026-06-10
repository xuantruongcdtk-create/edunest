import { randomBytes } from 'crypto'
import { getServerClient } from '@edunest/db'
import { createVnpayPaymentUrl } from '@edunest/services'
import { ok, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import { headers } from 'next/headers'
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

  const headersList = await headers()
  const clientIp    = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL!
  const orderId     = `EDN-${randomBytes(6).toString('hex').toUpperCase()}`
  const amountVnd   = PRICES[parsed.data.planTier]!

  await db.from('payment_transactions').insert({
    user_id:        user.id,
    provider:       'vnpay',
    provider_tx_id: orderId,
    amount_vnd:     amountVnd,
    plan_tier:      parsed.data.planTier,
    status:         'pending',
  })

  const payUrl = createVnpayPaymentUrl({
    orderId,
    userId:    user.id,
    planTier:  parsed.data.planTier,
    amountVnd,
    returnUrl: `${appUrl}/payment/result`,
    clientIp,
  })

  return ok({ payUrl, orderId })
})
