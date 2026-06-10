'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getBrowserClient } from '../../../lib/supabase'

/**
 * Handles both OAuth flows after Google redirects back:
 * - PKCE flow: URL has ?code=... → exchangeCodeForSession
 * - Implicit flow: URL has #access_token=... in hash → Supabase JS auto-processes
 */
export default function AuthCallbackPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next    = searchParams.get('next') ?? '/dashboard'
    const code    = searchParams.get('code')
    const errParam = searchParams.get('error')
    const supabase = getBrowserClient()

    if (errParam) {
      const desc = searchParams.get('error_description') ?? errParam
      router.replace(`/login?error=oauth&msg=${encodeURIComponent(desc)}`)
      return
    }

    if (code) {
      // PKCE flow
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.replace(`/login?error=oauth&msg=${encodeURIComponent(error.message)}`)
        } else {
          router.replace(next)
        }
      })
      return
    }

    // Implicit flow — @supabase/ssr browser client auto-processes hash tokens.
    // Wait one animation frame, then check if session was set.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace(next)
        return
      }
      // Listen for the SIGNED_IN event Supabase fires when it processes the hash
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
        if (event === 'SIGNED_IN' && sess) {
          subscription.unsubscribe()
          router.replace(next)
        }
      })
      // Safety timeout: if no session after 5s, redirect to login
      setTimeout(() => {
        subscription.unsubscribe()
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (s) {
            router.replace(next)
          } else {
            router.replace('/login?error=oauth&msg=no_session')
          }
        })
      }, 5000)
    }

    requestAnimationFrame(() => { checkSession() })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm">Đang xác thực...</p>
      </div>
    </div>
  )
}
