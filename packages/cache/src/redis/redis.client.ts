import { Redis } from '@upstash/redis'

let _instance: Redis | null = null

function getInstance(): Redis {
  if (!_instance) {
    const url   = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required')
    }
    _instance = new Redis({ url, token })
  }
  return _instance
}

// Proxy so all existing `redis.xxx()` callsites keep working
export const redis = new Proxy({} as Redis, {
  get(_target, prop: string) {
    return (getInstance() as unknown as Record<string, unknown>)[prop]
  },
})
