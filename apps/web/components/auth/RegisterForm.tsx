'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrowserClient } from '../../lib/supabase'

type Role = 'parent' | 'teacher' | 'bgh'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ['', 'Yếu', 'Trung bình', 'Mạnh']
  const colors = ['', 'bg-danger', 'bg-warning', 'bg-success']

  if (!password) return null

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? colors[score] : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${score === 1 ? 'text-danger' : score === 2 ? 'text-warning' : 'text-success'}`}>
        {labels[score]}
      </p>
    </div>
  )
}

export function RegisterForm() {
  const router = useRouter()

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [role,      setRole]      = useState<Role>('parent')
  const [showPwd,   setShowPwd]   = useState(false)
  const [agreed,    setAgreed]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('Vui lòng đồng ý với điều khoản sử dụng.'); return }
    if (password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return }

    setError(null)
    setLoading(true)

    try {
      const supabase = getBrowserClient()
      // Xoá phiên cũ ở client (scope 'local' — không gọi endpoint logout server,
      // tránh lỗi 400 khi không có phiên hợp lệ). Nếu không, khi bật xác nhận email
      // signUp không tạo phiên mới và người dùng sẽ kẹt ở tài khoản cũ.
      await supabase.auth.signOut({ scope: 'local' })

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/step-1`,
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Email này đã được đăng ký. Hãy đăng nhập.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      // If Supabase returned a session, email confirmation is disabled — go straight to onboarding
      if (data.session) {
        router.replace('/onboarding/step-1')
        return
      }

      // Otherwise show "check your email" screen
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setOauthLoading(true)
    const supabase = getBrowserClient()
    const { error: oErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/step-1`,
      },
    })
    if (oErr) {
      setError('Đăng nhập Google thất bại, thử lại sau.')
      setOauthLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-card shadow-card p-8 text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✉️</span>
        </div>
        <h2 className="font-display font-extrabold text-xl text-gray-900 mb-2">Kiểm tra email của bạn</h2>
        <p className="text-sm text-gray-500 mb-6">
          Chúng tôi đã gửi link xác nhận đến <strong className="text-gray-700">{email}</strong>.
          Nhấn vào link để hoàn tất đăng ký.
        </p>
        <Link
          href="/login"
          className="inline-block bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-btn hover:bg-primary-dark transition-colors"
        >
          Về trang đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-card p-8">
      <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-1">Tạo tài khoản</h1>
      <p className="text-sm text-gray-500 mb-6">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">Đăng nhập</Link>
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
        Đăng ký với Google
      </button>

      <div className="relative flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">hoặc</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {error && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bạn là</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'parent',  label: 'Phụ huynh',     icon: '👨‍👩‍👧' },
              { value: 'teacher', label: 'Giáo viên',     icon: '👩‍🏫' },
              { value: 'bgh',     label: 'Ban giám hiệu', icon: '🏫' },
            ] as { value: Role; label: string; icon: string }[]).map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-input border text-xs font-medium text-center transition-colors ${
                  role === value
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự"
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
          <PasswordStrength password={password} />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary accent-primary"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            Tôi đồng ý với{' '}
            <a href="/terms" target="_blank" className="text-primary hover:underline">Điều khoản sử dụng</a>
            {' '}và{' '}
            <a href="/privacy" target="_blank" className="text-primary hover:underline">Chính sách bảo mật</a>
            {' '}của EduNest.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !fullName || !email || !password || !agreed}
          className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>
    </div>
  )
}
