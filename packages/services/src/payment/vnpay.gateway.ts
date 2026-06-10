import crypto from 'crypto'
import { PaymentError } from '@edunest/core'
import type { PlanTier } from '@edunest/types'

interface VnpayPaymentInput {
  orderId: string
  userId: string
  planTier: PlanTier
  amountVnd: number
  returnUrl: string
  clientIp: string
  locale?: 'vn' | 'en'
}

export function createVnpayPaymentUrl(input: VnpayPaymentInput): string {
  const { VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL } = process.env
  if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_URL) {
    throw new PaymentError('VNPAY credentials not configured')
  }

  const now = new Date()
  const createDate = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)

  const params: Record<string, string> = {
    vnp_Version:    '2.1.0',
    vnp_Command:    'pay',
    vnp_TmnCode:    VNPAY_TMN_CODE,
    vnp_Amount:     String(input.amountVnd * 100), // VNPay uses 100x units
    vnp_CurrCode:   'VND',
    vnp_TxnRef:     input.orderId,
    vnp_OrderInfo:  `EduNest ${input.planTier} ${input.userId}`,
    vnp_OrderType:  'other',
    vnp_Locale:     input.locale ?? 'vn',
    vnp_ReturnUrl:  input.returnUrl,
    vnp_IpAddr:     input.clientIp,
    vnp_CreateDate: createDate,
  }

  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&')

  const hmac = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(sorted, 'utf-8'))
    .digest('hex')

  return `${VNPAY_URL}?${sorted}&vnp_SecureHash=${hmac}`
}

export function verifyVnpayReturn(query: Record<string, string>): boolean {
  const { vnp_SecureHash, ...rest } = query
  const secretKey = process.env.VNPAY_HASH_SECRET!

  const sorted = Object.keys(rest)
    .filter((k) => k.startsWith('vnp_'))
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('&')

  const expected = crypto
    .createHmac('sha512', secretKey)
    .update(Buffer.from(sorted, 'utf-8'))
    .digest('hex')

  return vnp_SecureHash?.toLowerCase() === expected.toLowerCase()
}
