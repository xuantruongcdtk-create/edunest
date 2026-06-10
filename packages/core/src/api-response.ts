import { NextResponse } from 'next/server'
import type { ApiOk, ApiErr, PaginationMeta } from '@edunest/types'
import { AppError } from './errors'
import { logger } from './logger'

export function ok<T>(data: T, meta?: PaginationMeta): NextResponse<ApiOk<T>> {
  return NextResponse.json({ ok: true as const, data, ...(meta && { meta }) }, { status: 200 })
}

export function created<T>(data: T): NextResponse<ApiOk<T>> {
  return NextResponse.json({ ok: true as const, data }, { status: 201 })
}

export function noContent(): Response {
  return new Response(null, { status: 204 })
}

export function apiError(error: unknown): NextResponse<ApiErr> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        ok: false as const,
        error: { code: error.code, message: error.message, details: error.details },
      },
      { status: error.statusCode },
    )
  }

  logger.error('[API] Unhandled error', { error: String(error) })
  return NextResponse.json(
    { ok: false as const, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 },
  )
}

/**
 * Wraps an async route handler; catches any thrown AppError or unknown
 * and converts it to a typed JSON error response.
 *
 * @example
 * export const GET = withHandler(async (req) => {
 *   const data = await myService.fetch()
 *   return ok(data)
 * })
 */
export function withHandler<T>(
  fn: (req: Request) => Promise<NextResponse<T>>,
): (req: Request) => Promise<NextResponse<T | ApiErr>> {
  return (req) => fn(req).catch(apiError)
}
