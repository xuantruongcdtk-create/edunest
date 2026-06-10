import crypto from 'crypto'
import { PaymentError } from '@edunest/core'
import type { PlanTier } from '@edunest/types'

interface MomoPaymentInput {
  orderId: string
  userId: string
  planTier: PlanTier
  amountVnd: number
  redirectUrl: string
  ipnUrl: string
}

interface MomoPaymentResult {
  payUrl: string
  orderId: string
  requestId: string
}

const PLAN_NAMES: Record<PlanTier, string> = {
  free:   'Gói Miễn Phí',
  basic:  'Gói Cơ Bản',
  pro:    'Gói Nâng Cao',
  school: 'Gói Trường',
}

export async function createMomoPayment(input: MomoPaymentInput): Promise<MomoPaymentResult> {
  const { MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_ENDPOINT } = process.env
  if (!MOMO_PARTNER_CODE || !MOMO_ACCESS_KEY || !MOMO_SECRET_KEY || !MOMO_ENDPOINT) {
    throw new PaymentError('MoMo credentials not configured')
  }

  const requestId = `${input.orderId}-${Date.now()}`
  const orderInfo = `EduNest ${PLAN_NAMES[input.planTier]} - ${input.userId}`
  const extraData = Buffer.from(JSON.stringify({ userId: input.userId, planTier: input.planTier })).toString('base64')

  const rawSignature = [
    `accessKey=${MOMO_ACCESS_KEY}`,
    `amount=${input.amountVnd}`,
    `extraData=${extraData}`,
    `ipnUrl=${input.ipnUrl}`,
    `orderId=${input.orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${MOMO_PARTNER_CODE}`,
    `redirectUrl=${input.redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=payWithMethod`,
  ].join('&')

  const signature = crypto
    .createHmac('sha256', MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex')

  const body = {
    partnerCode: MOMO_PARTNER_CODE,
    accessKey:   MOMO_ACCESS_KEY,
    requestId,
    amount:      input.amountVnd,
    orderId:     input.orderId,
    orderInfo,
    redirectUrl: input.redirectUrl,
    ipnUrl:      input.ipnUrl,
    extraData,
    requestType: 'payWithMethod',
    signature,
    lang:        'vi',
  }

  const res = await fetch(MOMO_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  const data = await res.json() as { resultCode: number; payUrl: string; message: string }
  if (data.resultCode !== 0) {
    throw new PaymentError(`MoMo error ${data.resultCode}: ${data.message}`, data)
  }

  return { payUrl: data.payUrl, orderId: input.orderId, requestId }
}

export function verifyMomoWebhook(body: Record<string, string>, signature: string): boolean {
  const secretKey = process.env.MOMO_SECRET_KEY!
  const rawSig = Object.keys(body)
    .filter((k) => k !== 'signature')
    .sort()
    .map((k) => `${k}=${body[k]}`)
    .join('&')

  const expected = crypto.createHmac('sha256', secretKey).update(rawSig).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
