'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient }    from '../../lib/supabase'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:   { label: 'Miễn phí',  color: 'bg-gray-100 text-gray-600' },
  basic:  { label: 'Cơ bản',    color: 'bg-primary/10 text-primary' },
  pro:    { label: 'Nâng cao',  color: 'bg-accent/10 text-accent' },
  school: { label: 'Trường học', color: 'bg-bgh-blue/10 text-bgh-blue' },
}

export default function SettingsPage() {

  const [profile,   setProfile]   = useState<{ full_name: string; email: string; phone: string; role: string; plan_tier: string } | null>(null)
  const [fullName,  setFullName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function load() {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return

      const { data } = await sb
        .from('profiles')
        .select('full_name, role, plan_tier, phone, email')
        .eq('id', user.id)
        .single()

      const p = data as { full_name: string; role: string; plan_tier: string; phone: string | null; email: string | null } | null
      setProfile({ full_name: p?.full_name ?? '', email: p?.email ?? '', phone: p?.phone ?? '', role: p?.role ?? 'parent', plan_tier: p?.plan_tier ?? 'free' })
      setFullName(p?.full_name ?? '')
      setPhone(p?.phone ?? '')
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSaving(true); setSaved(false)

    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setError('Phiên đăng nhập hết hạn.'); setSaving(false); return }

    const { error: uErr } = await sb
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', user.id)

    setSaving(false)
    if (uErr) { setError('Không thể lưu. Thử lại nhé.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleLogout() {
    setLoggingOut(true)
    const sb = getBrowserClient()
    await sb.auth.signOut({ scope: 'local' })
    window.location.assign('/login')
  }

  const planInfo = PLAN_LABELS[profile?.plan_tier ?? 'free'] ?? PLAN_LABELS.free!

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-gray-900">Cài đặt tài khoản</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin và tuỳ chỉnh trải nghiệm của bạn.</p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-card shadow-card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Thông tin cá nhân</h2>

        {error && <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2 mb-4">{error}</div>}
        {saved && <div className="bg-success/8 border border-success/20 text-success text-sm rounded-input px-3 py-2 mb-4">✓ Đã lưu thành công!</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full border border-gray-100 rounded-input px-3.5 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số điện thoại <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>

      {/* Plan section */}
      <div className="bg-white rounded-card shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-gray-900">Gói dịch vụ</h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planInfo.color}`}>
            {planInfo.label}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {profile?.plan_tier === 'free'
            ? 'Bạn đang dùng gói Miễn phí. Nâng cấp để mở khoá thêm tính năng AI Coach và báo cáo nâng cao.'
            : 'Bạn đang dùng gói trả phí. Cảm ơn bạn đã ủng hộ EduNest!'}
        </p>
        <a
          href="/settings/billing"
          className="inline-block bg-primary text-white text-sm font-semibold px-5 py-2 rounded-btn hover:bg-primary-dark transition-colors"
        >
          {profile?.plan_tier === 'free' ? 'Xem các gói nâng cấp →' : 'Quản lý gói & thanh toán →'}
        </a>
      </div>

      {/* Account section */}
      <div className="bg-white rounded-card shadow-card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Tài khoản</h2>
        <div className="space-y-3">
          <a
            href="/forgot-password"
            className="flex items-center justify-between py-2 text-sm text-gray-700 hover:text-primary transition-colors"
          >
            <span>Đổi mật khẩu</span>
            <span className="text-gray-300">›</span>
          </a>
          <hr className="border-gray-100" />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 text-sm text-danger font-medium hover:opacity-80 transition-opacity disabled:opacity-60"
          >
            {loggingOut && <span className="h-3.5 w-3.5 border-2 border-danger/40 border-t-danger rounded-full animate-spin" />}
            {loggingOut ? 'Đang đăng xuất...' : '↩ Đăng xuất'}
          </button>
        </div>
      </div>
    </div>
  )
}
