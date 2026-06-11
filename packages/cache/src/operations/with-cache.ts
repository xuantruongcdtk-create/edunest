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
  try {
    const cached = await cacheGet<T>(key)
    if (cached !== null) return cached
  } catch {
    // Redis unavailable — skip cache read, fetch fresh
  }

  const fresh = await fetcher()

  try {
    await cacheSet(key, fresh, ttlSeconds)
  } catch {
    // Redis unavailable — return data without caching
  }

  return fresh
}
