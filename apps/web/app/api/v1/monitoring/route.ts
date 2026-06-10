import { redis } from '@edunest/cache'
import { ok, withHandler } from '@edunest/core'

export const GET = withHandler(async (_req) => {
  const [ping] = await Promise.all([redis.ping()])
  return ok({
    status:    'ok',
    timestamp: new Date().toISOString(),
    redis:     ping === 'PONG' ? 'ok' : 'error',
  })
})
