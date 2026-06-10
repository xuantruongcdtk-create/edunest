import { adminClient, assertNoError, paginationRange, buildMeta } from '@edunest/db'
import { getServerClient } from '@edunest/db'
import { ok, withHandler, UnauthorizedError, ForbiddenError } from '@edunest/core'

export const GET = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') throw new ForbiddenError()

  const { searchParams } = new URL(req.url)
  const page    = Number(searchParams.get('page')    ?? 1)
  const perPage = Number(searchParams.get('per_page') ?? 20)
  const { from, to } = paginationRange(page, perPage)

  const { data, error, count } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  assertNoError(error)
  return ok(data ?? [], buildMeta(page, perPage, count ?? 0))
})
