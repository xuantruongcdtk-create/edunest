'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '../../../../lib/supabase'

interface CurrentSchool {
  id:   string
  name: string
}

export default function TeacherJoinSchoolPage() {
  const [code,     setCode]     = useState('')
  const [current,  setCurrent]  = useState<CurrentSchool | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  async function loadCurrent() {
    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await sb
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single()

    const schoolId = (profile as { school_id: string | null } | null)?.school_id
    if (schoolId) {
      const { data: school } = await sb.from('schools').select('id, name').eq('id', schoolId).single()
      setCurrent((school as CurrentSchool | null) ?? null)
    } else {
      setCurrent(null)
    }
    setLoading(false)
  }

  useEffect(() => { loadCurrent() }, [])

  async function handleJoin() {
    if (!code.trim()) { setError('Vui lòng nhập mã trường'); return }
    setSaving(true); setError(null); setSuccess(null)

    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    // Tìm trường theo mã (RLS cho phép mọi user đã đăng nhập đọc schools)
    const { data: school } = await (sb as any)
      .from('schools')
      .select('id, name')
      .eq('join_code', code.toUpperCase().trim())
      .single()

    if (!school) {
      setError('Mã trường không tồn tại. Vui lòng kiểm tra lại mã do Ban giám hiệu cung cấp.')
      setSaving(false)
      return
    }

    // Liên kết giáo viên với trường
    const { error: linkErr } = await sb
      .from('profiles')
      .update({ school_id: (school as { id: string }).id })
      .eq('id', user.id)

    setSaving(false)
    if (linkErr) { setError('Không thể tham gia trường. Thử lại nhé.'); return }

    setCurrent(school as CurrentSchool)
    setCode('')
    setSuccess(`Đã tham gia ${(school as { name: string }).name}`)
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="font-display font-bold text-xl text-gray-900">Tham gia trường</h1>
        <p className="text-sm text-gray-500">Nhập mã trường do Ban giám hiệu cung cấp để được gán dạy lớp</p>
      </div>

      <div className="p-6 flex justify-center">
        <div className="w-full max-w-md space-y-4">
          {/* Trạng thái hiện tại */}
          {!loading && current && (
            <div className="bg-success/8 border border-success/20 rounded-card p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Đang thuộc trường</p>
                <p className="text-sm text-success font-medium">{current.name}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-card shadow-card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {current ? 'Đổi sang trường khác (nhập mã mới)' : 'Mã trường'}
              </label>
              <input
                type="text"
                placeholder="VD: AB3XYZ"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                maxLength={10}
                className="w-full border border-gray-200 rounded-input px-4 py-3 text-xl font-mono font-bold text-center tracking-[0.25em] uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-input px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-sm text-success bg-success/8 border border-success/20 rounded-input px-3 py-2">{success}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={saving || !code.trim()}
              className="w-full bg-primary text-white font-semibold py-3 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {saving ? 'Đang xử lý...' : 'Tham gia trường →'}
            </button>
          </div>

          <div className="bg-primary/4 border border-primary/15 rounded-card p-4">
            <p className="text-xs font-semibold text-primary mb-2">Hướng dẫn</p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Xin mã trường từ Ban giám hiệu (BGH thấy mã ở trang Lớp học)</li>
              <li>Sau khi tham gia, BGH có thể gán bạn làm chủ nhiệm các lớp</li>
              <li>Khi làm chủ nhiệm lớp, bạn giao bài kiểm tra cho lớp đó được</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
