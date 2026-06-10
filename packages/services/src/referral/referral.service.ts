import { getServerClient, assertNoError } from '@edunest/db'
import type { Referral } from '@edunest/types'
import { ConflictError } from '@edunest/core'
import { nanoid } from 'nanoid'

export function generateReferralCode(): string {
  return nanoid(8).toUpperCase()
}

export async function applyReferralCode(
  newUserId: string,
  code: string,
): Promise<Referral | null> {
  const db = await getServerClient()

  // Find referrer by code
  const { data: referrer, error: re } = await db
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .single()

  if (re?.code === 'PGRST116') return null // code doesn't exist — silently skip
  assertNoError(re)
  if (!referrer) return null

  if ((referrer as { id: string }).id === newUserId) return null // can't refer yourself

  // Upsert to avoid duplicate referrals
  const { data, error } = await (db as any)
    .from('referrals')
    .upsert(
      {
        referrer_id:    (referrer as { id: string }).id,
        referred_id:    newUserId,
        status:         'pending',
        reward_granted: false,
      },
      { onConflict: 'referred_id', ignoreDuplicates: true },
    )
    .select()
    .single()

  if (error?.code === '23505') throw new ConflictError('Referral already exists')
  assertNoError(error)
  return data as Referral
}

export async function convertReferral(referredId: string): Promise<void> {
  const db = await getServerClient()
  await (db as any)
    .from('referrals')
    .update({ status: 'converted', reward_granted: true })
    .eq('referred_id', referredId)
    .eq('status', 'pending')
}
