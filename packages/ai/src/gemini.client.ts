import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerateContentStreamResult,
  type Content,
} from '@google/generative-ai'
import { redis } from '@edunest/cache'
import { CacheKeys } from '@edunest/cache'
import { RateLimitError } from '@edunest/core'

// ─── Client singleton ────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? '')

/** Primary model for AI coaching and quiz generation. */
export const AI_MODEL    = 'gemini-1.5-flash' as const
/** Higher-quality model for weekly summaries and insight generation. */
export const AI_MODEL_PRO = 'gemini-1.5-pro' as const

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
]

export function getModel(modelId: typeof AI_MODEL | typeof AI_MODEL_PRO = AI_MODEL) {
  return genAI.getGenerativeModel({ model: modelId, safetySettings: SAFETY_SETTINGS })
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

const RATE_LIMITS = {
  coach: { max: 10, windowSecs: 3600 },
  quiz:  { max: 20, windowSecs: 3600 },
} as const

export type AIAction = keyof typeof RATE_LIMITS

/**
 * Increments the per-user rate-limit counter.
 * Throws `RateLimitError` when the hourly cap is exceeded.
 */
export async function checkAIRateLimit(userId: string, action: AIAction): Promise<void> {
  const { max, windowSecs } = RATE_LIMITS[action]
  const key = CacheKeys.rateLimit(userId, `ai:${action}`)

  try {
    const current = await redis.incr(key)
    if (current === 1) await redis.expire(key, windowSecs)
    if (current > max) {
      const ttl = await redis.ttl(key)
      throw new RateLimitError(ttl > 0 ? ttl : windowSecs)
    }
  } catch (err) {
    // If it's a RateLimitError, re-throw it
    if (err instanceof RateLimitError) throw err
    // Otherwise (Redis misconfigured / NOPERM), log and allow request through
    console.warn('[AI rate limit] Redis error, skipping rate check:', String(err))
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Non-streaming text generation — for quiz generation, weekly insights, etc.
 */
export async function generateText(
  prompt: string,
  modelId: typeof AI_MODEL | typeof AI_MODEL_PRO = AI_MODEL,
): Promise<string> {
  const model  = getModel(modelId)
  const result = await model.generateContent(prompt)
  return result.response.text()
}

/**
 * Streaming chat — for AI coach real-time replies.
 * Returns a Gemini stream; caller iterates with `for await (const chunk of stream.stream)`.
 */
export async function createCoachStream(
  history: Content[],
  systemInstruction: string,
  userMessage: string,
): Promise<GenerateContentStreamResult> {
  const model = getModel(AI_MODEL)

  const chat = model.startChat({
    history,
    systemInstruction: { role: 'user', parts: [{ text: systemInstruction }] },
    generationConfig: { maxOutputTokens: 1024 },
  })

  return chat.sendMessageStream(userMessage)
}

export { GoogleGenerativeAI, type Content, type GenerateContentStreamResult }
