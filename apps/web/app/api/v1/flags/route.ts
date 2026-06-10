import { getServerClient, assertNoError } from '@edunest/db'
import { withCache, CacheKeys, TTL } from '@edunest/cache'
import { ok, withHandler } from '@edunest/core'

export const GET = withHandler(async (_req) => {
  const flags = await withCache(CacheKeys.featureFlags(), TTL.featureFlags, async () => {
    const db = await getServerClient()
    const { data, error } = await db
      .from('feature_flags')
      .select('key, enabled, rollout_pct, allowed_roles')
      .order('key')
    assertNoError(error)
    return data ?? []
  })
  return ok(flags)
})
