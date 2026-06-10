import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(1),

  // Google AI (Gemini)
  GOOGLE_AI_API_KEY: z.string().min(1),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL:   z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // MoMo
  MOMO_PARTNER_CODE: z.string().min(1),
  MOMO_ACCESS_KEY:   z.string().min(1),
  MOMO_SECRET_KEY:   z.string().min(1),
  MOMO_ENDPOINT:     z.string().url(),

  // VNPAY
  VNPAY_TMN_CODE:    z.string().min(1),
  VNPAY_HASH_SECRET: z.string().min(1),
  VNPAY_URL:         z.string().url(),

  // Google Cloud Vision (OCR) — JSON credentials as string (optional, needed only for OCR feature)
  GOOGLE_CLOUD_CREDENTIALS: z.string().min(1).optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  CRON_SECRET:         z.string().min(32),

  // Email (Resend) — optional during development
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
})

export type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2))
    throw new Error('Invalid environment variables. Fix the values above and restart.')
  }
  return result.data
}

// Validated once at cold-start — throws before accepting any traffic
export const env = parseEnv()
