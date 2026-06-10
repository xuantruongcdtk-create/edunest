import { redis } from '../redis/redis.client'

export async function cacheGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key)
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds })
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length > 0) await redis.del(...keys)
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}
