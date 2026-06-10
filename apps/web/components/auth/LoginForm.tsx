'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getBrowserClient } from '../../lib/supabase'

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const nextUrl      = searchParams.get('next') ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const oauthError = searchParams.get('error') === 'oauth'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email hoặc mật khẩu không đúng.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Vui lòng xác nhận email trước khi đăng nhập.')
        } else {
          setError(signInError.message)
        }
        return
      }

      router.push(nextUrl)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setOauthLoading(true)
    const supabase  = getBrowserClient()
    const { error: oErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${nextUrl}`,
      },
    })
    if (oErr) {
      setError('Đăng nhập Google thất bại, thử lại sau.')
      setOauthLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-card shadow-card p-8">
      <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-1">Đăng nhập</h1>
      <p className="text-sm text-gray-500 mb-6">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">Đăng ký miễn phí</Link>
      </p>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={oauthLoading || loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-btn py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 mb-5"
      >
        {oauthLoading ? (
          <span className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Tiếp tục với Google
      </button>

      <div className="relative flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">hoặc</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Error banner */}
      {(error || oauthError) && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5 mb-4">
          {error ?? 'Đăng nhập Google thất bại. Vui lòng thử lại.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="ten@email.com"
            className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPwd ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}
