import { NextResponse }              from 'next/server'
import { getServerClient, adminClient } from '@edunest/db'

const VALID_ROLES = ['parent', 'teacher', 'bgh', 'admin']

export async function POST(request: Request) {
  try {
    const { role } = await request.json() as { role?: string }

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Identify the caller from their session cookie
    const db = await getServerClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    // Use admin client to bypass RLS — user can only update their own row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = adminClient.from('profiles') as any
    const { error, data: updated } = await table.update({ role }).eq('id', user.id).select('id')

    if (error) {
      console.error('[update-role] DB error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Profile doesn't exist yet — create it
    if (!updated || (updated as unknown[]).length === 0) {
      const { error: insertErr } = await table.insert({ id: user.id, email: user.email!, role })
      if (insertErr) {
        console.error('[update-role] insert error:', insertErr.message)
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, role })
  } catch (err) {
    console.error('[update-role] unexpected error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
