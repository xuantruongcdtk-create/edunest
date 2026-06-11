'use client'

import { useState, useEffect } from 'react'
import Link                     from 'next/link'
import { getBrowserClient }     from '../../../../lib/supabase'
import { useUser }              from '../../../../lib/user-context'

interface Child {
  id:        string
  full_name: string
  grade:     number
}

interface JoinResult {
  className:   string
  classGrade:  number
  teacherName: string
  childName:   string
}

export default function ParentJoinClassPage() {
  const { userId } = useUser()

  const [code,            setCode]            = useState('')
  const [children,        setChildren]        = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [result,          setResult]          = useState<JoinResult | null>(null)
  const [error,           setError]           = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!userId) return
      const sb = getBrowserClient()
      const { data } = await sb
        .from('children')
        .select('id, full_name, grade')
        .eq('parent_id', userId)
        .order('full_name', { ascending: true })
      const kids = (data ?? []) as Child[]
      setChildren(kids)
      if (kids.length === 1) setSelectedChildId(kids[0].id)
      setChildrenLoading(false)
    }
    load()
  }, [userId])

  async function handleJoin() {
    if (!code.trim()) { setError('Vui lòng nhập mã lớp'); return }
    if (!selectedChildId) { setError('Vui lòng chọn con'); return }

    setLoading(true); setError(null)

    const res = await fetch('/api/v1/classes/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ joinCode: code.trim(), childId: selectedChildId }),
    })

    const json = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError((json as { error?: string }).error ?? 'Tham gia lớp thất bại')
      return
    }

    setResult((json as { data: JoinResult }).data)
    setCode('')
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="font-display font-bold text-xl text-gray-900">Tham gia lớp học</h1>
        <p className="text-sm text-gray-500">Nhập mã lớp do giáo viên cung cấp để đăng ký con vào lớp</p>
      </div>

      <div className="p-6 flex justify-center">
        <div className="w-full max-w-md space-y-4">

          {result ? (
            /* ── Success state ──────────────────────────────────────────── */
            <div className="bg-white rounded-card shadow-card p-8 text-center">
              <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Tham gia thành công!</h2>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">{result.childName}</span> đã tham gia lớp{' '}
                <span className="font-semibold text-primary">{result.className}</span>
              </p>
              <p className="text-sm text-gray-400 mb-6">Giáo viên: {result.teacherName}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setResult(null)}
                  className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-btn hover:bg-gray-50 transition-colors">
                  Nhập mã khác
                </button>
                <Link
                  href="/parent/quiz"
                  className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors">
                  Xem bài kiểm tra →
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form ────────────────────────────────────────────────────── */
            <div className="bg-white rounded-card shadow-card p-6 space-y-4">
              {/* Code input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mã lớp học
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

              {/* Child selector */}
              {childrenLoading ? (
                <div className="h-10 bg-gray-100 rounded-input animate-pulse" />
              ) : children.length === 0 ? (
                <div className="bg-warning/8 border border-warning/20 rounded-input p-3 text-sm text-warning">
                  Bạn chưa có hồ sơ con.{' '}
                  <Link href="/parent/children" className="font-semibold underline">
                    Thêm hồ sơ con trước
                  </Link>
                </div>
              ) : children.length === 1 ? (
                <div className="bg-gray-50 border border-gray-100 rounded-input px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm font-bold">{children[0].full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{children[0].full_name}</p>
                    <p className="text-xs text-gray-400">Lớp {children[0].grade}</p>
                  </div>
                  <span className="ml-auto text-xs text-success font-medium">Đã chọn ✓</span>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Đăng ký cho con</label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full border border-gray-200 rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">-- Chọn con --</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} (Lớp {c.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-input px-3 py-2">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleJoin}
                disabled={loading || !code.trim() || !selectedChildId || children.length === 0}
                className="w-full bg-primary text-white font-semibold py-3 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading && (
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {loading ? 'Đang xử lý...' : 'Tham gia lớp →'}
              </button>
            </div>
          )}

          {/* Guide */}
          <div className="bg-primary/4 border border-primary/15 rounded-card p-4">
            <p className="text-xs font-semibold text-primary mb-2">Hướng dẫn</p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Xin mã tham gia lớp từ giáo viên chủ nhiệm</li>
              <li>Mã gồm 6 ký tự in hoa, ví dụ: <span className="font-mono font-bold tracking-wider">AB3XYZ</span></li>
              <li>Mỗi lớp có một mã riêng biệt</li>
              <li>Sau khi tham gia, bài kiểm tra của lớp xuất hiện ngay tại <Link href="/parent/quiz" className="text-primary font-medium underline">Bài kiểm tra</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
