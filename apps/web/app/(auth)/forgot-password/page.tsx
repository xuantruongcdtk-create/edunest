'use client'

import { useState }         from 'react'
import Link                  from 'next/link'
import { getBrowserClient }  from '../../../lib/supabase'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const sb = getBrowserClient()
    const { error: resetErr } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)
    if (resetErr) { setError('Không thể gửi email. Kiểm tra lại địa chỉ email.'); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="bg-white rounded-card shadow-card p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📧</span>
        </div>
        <h2 className="font-display font-extrabold text-xl text-gray-900 mb-2">Kiểm tra email</h2>
        <p className="text-sm text-gray-500 mb-6">
          Chúng tôi đã gửi link đặt lại mật khẩu đến <strong className="text-gray-700">{email}</strong>.
        </p>
        <Link href="/login" className="text-sm text-primary font-medium hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-card p-8">
      <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-1">Quên mật khẩu</h1>
      <p className="text-sm text-gray-500 mb-6">
        Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      {error && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5 mb-4">{error}</div>
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
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </button>
        <p className="text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:text-primary transition-colors">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </div>
  )
}
