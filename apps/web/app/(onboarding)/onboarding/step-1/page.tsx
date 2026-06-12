'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { getBrowserClient }    from '../../../../lib/supabase'

export default function OnboardingStep1() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [role,     setRole]     = useState('parent')
  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await sb
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', user.id)
        .single()

      if (data) {
        const d = data as { full_name: string; phone: string | null; role: string | null }
        setFullName(d.full_name ?? '')
        setPhone(d.phone ?? '')
        // Keep existing role if already set, otherwise fall back to metadata
        setRole(d.role ?? user.user_metadata?.role ?? 'parent')
      } else {
        // Profile not yet created — prefill from auth metadata
        setFullName(user.user_metadata?.full_name ?? '')
        setRole(user.user_metadata?.role ?? 'parent')
      }
      setFetching(false)
    }
    loadProfile()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Vui lòng nhập họ và tên.'); return }
    setError(null)
    setLoading(true)

    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: uErr } = await sb
      .from('profiles')
      .upsert({
        id:        user.id,
        email:     user.email!,
        full_name: fullName.trim(),
        phone:     phone.trim() || null,
        role,
      })

    setLoading(false)
    if (uErr) { setError(`[debug] ${uErr.code}: ${uErr.message}`); return }

    router.push('/onboarding/step-2')
  }

  if (fetching) {
    return (
      <div className="p-8">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded mt-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-1">
          Thông tin cá nhân
        </h1>
        <p className="text-sm text-gray-500">
          Hãy cho chúng tôi biết thêm về bạn để cá nhân hóa trải nghiệm.
        </p>
      </div>

      {error && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chọn vai trò — phân loại tài khoản (quan trọng cho đăng nhập Google) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bạn là <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'parent',  label: 'Phụ huynh',     icon: '👨‍👩‍👧' },
              { value: 'teacher', label: 'Giáo viên',     icon: '👩‍🏫' },
              { value: 'bgh',     label: 'Ban giám hiệu', icon: '🏫' },
            ] as { value: string; label: string; icon: string }[]).map(({ value, label, icon }) => (
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Họ và tên <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Nguyễn Văn A"
            className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
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
            className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !fullName.trim()}
          className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? 'Đang lưu...' : 'Tiếp theo →'}
        </button>
      </form>
    </div>
  )
}
