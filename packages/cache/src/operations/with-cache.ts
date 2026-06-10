import { cacheGet, cacheSet } from './cache.ops'

/**
 * Read-through cache helper.
 * Returns cached value when present; otherwise calls `fetcher`, stores the
 * result, and returns it.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  await cacheSet(key, fresh, ttlSeconds)
  return fresh
}
