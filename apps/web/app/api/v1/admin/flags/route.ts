import { getServerClient, assertNoError } from '@edunest/db'
import { invalidateFeatureFlags } from '@edunest/cache'
import { ok, withHandler, UnauthorizedError, ForbiddenError, ValidationError } from '@edunest/core'
import { z } from 'zod'

const UpdateFlagSchema = z.object({
  key:         z.string().min(1),
  enabled:     z.boolean().optional(),
  rollout_pct: z.number().int().min(0).max(100).optional(),
}).refine((d) => d.enabled !== undefined || d.rollout_pct !== undefined, {
  message: 'Provide at least one of: enabled, rollout_pct',
})

export const GET = withHandler(async (_req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') throw new ForbiddenError()

  const { data, error } = await db
    .from('feature_flags')
    .select('*')
    .order('key')
  assertNoError(error)
  return ok(data ?? [])
})

export const PATCH = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') throw new ForbiddenError()

  const body   = await req.json()
  const parsed = UpdateFlagSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten())

  const { key, ...updates } = parsed.data
  const { data, error } = await (db as any)
    .from('feature_flags')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single()
  assertNoError(error)

  await invalidateFeatureFlags()
  return ok(data)
})
