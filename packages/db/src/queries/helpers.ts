import type { PostgrestError } from '@supabase/supabase-js'
import { AppError, NotFoundError, ConflictError } from '@edunest/core'

/** Throws a typed AppError for known Postgres error codes. */
export function assertNoError(error: PostgrestError | null): void {
  if (!error) return
  switch (error.code) {
    case 'PGRST116': throw new NotFoundError('Record')
    case '23505':    throw new ConflictError('Record already exists')
    default:         throw new AppError('DB_ERROR', error.message, 500, { pg_code: error.code })
  }
}

/** Convert 1-based page + perPage into Supabase `.range(from, to)` values. */
export function paginationRange(page: number, perPage: number): { from: number; to: number } {
  const from = (page - 1) * perPage
  return { from, to: from + perPage - 1 }
}

/** Build a PaginationMeta object given raw count from Supabase. */
export function buildMeta(page: number, perPage: number, total: number) {
  return {
    page,
    per_page:    perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  }
}
