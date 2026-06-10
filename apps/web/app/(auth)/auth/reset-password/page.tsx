'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams }    from 'next/navigation'
import Link                              from 'next/link'
import { getBrowserClient }              from '../../../../lib/supabase'

type Stage = 'verifying' | 'ready' | 'success' | 'error'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const bars  = [
    'bg-danger', 'bg-warning', 'bg-warning', 'bg-success',
  ]
  const labels = ['Quá yếu', 'Yếu', 'Trung bình', 'Mạnh']

  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? bars[score - 1] : 'bg-gray-100'}`} />
        ))}
      </div>
      <p className={`text-xs ${score <= 1 ? 'text-danger' : score <= 2 ? 'text-warning' : 'text-success'}`}>
        {labels[score - 1] ?? ''}
      </p>
    </div>
  )
}

function ResetPasswordContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [stage,    setStage]    = useState<Stage>('verifying')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Exchange the one-time code sent by Supabase for a session
  useEffect(() => {
    async function verify() {
      const code = searchParams.get('code')
      if (!code) { setStage('error'); return }

      const sb = getBrowserClient()
      const { error: exchErr } = await sb.auth.exchangeCodeForSession(code)
      if (exchErr) { setStage('error'); return }
      setStage('ready')
    }
    verify()
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Mật khẩu nhập lại không khớp.'); return }
    if (password.length < 8)  { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return }

    setError(null); setSaving(true)

    const sb = getBrowserClient()
    const { error: updateErr } = await sb.auth.updateUser({ password })

    setSaving(false)
    if (updateErr) { setError('Không thể cập nhật mật khẩu. Link đã hết hạn?'); return }
    setStage('success')
  }

  // ── Verifying ──────────────────────────────────────────────────────────
  if (stage === 'verifying') {
    return (
      <div className="bg-white rounded-card shadow-card p-10 text-center">
        <span className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin inline-block mb-4" />
        <p className="text-sm text-gray-500">Đang xác thực liên kết...</p>
      </div>
    )
  }

  // ── Invalid / expired link ─────────────────────────────────────────────
  if (stage === 'error') {
    return (
      <div className="bg-white rounded-card shadow-card p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="font-display font-extrabold text-xl text-gray-900 mb-2">Link không hợp lệ</h2>
        <p className="text-sm text-gray-500 mb-6">
          Link đặt lại mật khẩu đã hết hạn hoặc đã được dùng trước đó.
          Vui lòng yêu cầu gửi lại.
        </p>
        <Link href="/forgot-password"
          className="inline-block bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-btn hover:bg-primary-dark transition-colors mb-3">
          Gửi lại email đặt lại mật khẩu
        </Link>
        <br />
        <Link href="/login" className="text-sm text-gray-500 hover:text-primary transition-colors">
          ← Quay lại đăng nhập
        </Link>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <div className="bg-white rounded-card shadow-card p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="font-display font-extrabold text-xl text-gray-900 mb-2">Mật khẩu đã được cập nhật!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Mật khẩu mới của bạn đã được lưu. Đăng nhập để tiếp tục.
        </p>
        <button onClick={() => router.push('/dashboard')}
          className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors mb-3">
          Vào Dashboard →
        </button>
        <Link href="/login" className="text-sm text-gray-500 hover:text-primary transition-colors">
          Hoặc đăng nhập lại
        </Link>
      </div>
    )
  }

  // ── Ready — enter new password ─────────────────────────────────────────
  return (
    <div className="bg-white rounded-card shadow-card p-8">
      <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-1">Đặt mật khẩu mới</h1>
      <p className="text-sm text-gray-500 mb-6">
        Nhập mật khẩu mới cho tài khoản của bạn.
      </p>

      {error && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự"
              className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs">
              {showPw ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhập lại mật khẩu</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            className={`w-full border rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
              confirm && confirm !== password
                ? 'border-danger/50 focus:ring-danger/30 focus:border-danger'
                : 'border-gray-200 focus:ring-primary/30 focus:border-primary'
            }`}
          />
          {confirm && confirm !== password && (
            <p className="text-xs text-danger mt-1">Mật khẩu không khớp</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || !password || !confirm || password !== confirm}
          className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {saving ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-card shadow-card p-10 text-center">
        <span className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
