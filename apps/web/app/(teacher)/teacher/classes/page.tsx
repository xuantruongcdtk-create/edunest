'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrowserClient } from '../../../../../lib/supabase'

interface Class {
  id:            string
  name:          string
  grade:         number
  academic_year: string
  join_code:     string
  student_count: number
  created_at:    string
}

const CURRENT_YEAR = '2025-2026'

export default function TeacherClassesPage() {
  const [classes,     setClasses]     = useState<Class[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [creating,    setCreating]    = useState(false)
  const [createErr,   setCreateErr]   = useState<string | null>(null)
  const [copiedId,    setCopiedId]    = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)

  // Form
  const [formName,  setFormName]  = useState('')
  const [formGrade, setFormGrade] = useState(10)
  const [formYear,  setFormYear]  = useState(CURRENT_YEAR)

  const loadClasses = useCallback(async () => {
    const sb = getBrowserClient()
    const { data } = await (sb as any)
      .from('classes')
      .select('id, name, grade, academic_year, join_code, student_count, created_at')
      .order('grade', { ascending: true })
    setClasses((data ?? []) as Class[])
    setLoading(false)
  }, [])

  useEffect(() => { loadClasses() }, [loadClasses])

  async function createClass() {
    if (!formName.trim()) { setCreateErr('Vui lòng nhập tên lớp'); return }
    setCreating(true); setCreateErr(null)

    const res = await fetch('/api/v1/classes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: formName.trim(), grade: formGrade, academicYear: formYear }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setCreateErr((err as { error?: string }).error ?? 'Tạo lớp thất bại')
      setCreating(false)
      return
    }

    await loadClasses()
    setShowCreate(false)
    setFormName('')
    setFormGrade(10)
    setCreating(false)
    setSuccessMsg('✓ Đã tạo lớp')
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  async function deleteClass(id: string, name: string) {
    if (!window.confirm(`Xoá lớp "${name}"? Tất cả học sinh sẽ bị xoá khỏi lớp.`)) return
    const sb = getBrowserClient()
    await sb.from('classes').delete().eq('id', id)
    setClasses((prev) => prev.filter((c) => c.id !== id))
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Lớp học</h1>
          <p className="text-sm text-gray-500">Tạo lớp và chia sẻ mã tham gia cho phụ huynh</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {successMsg && (
            <span className="text-xs text-success font-medium">{successMsg}</span>
          )}
          <button
            onClick={() => { setShowCreate(true); setCreateErr(null) }}
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors flex items-center gap-1.5">
            + Tạo lớp mới
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-card shadow-card p-5 border-2 border-primary/20">
            <h3 className="font-display font-semibold text-gray-900 mb-4">Tạo lớp mới</h3>
            {createErr && (
              <p className="text-xs text-danger bg-danger/8 border border-danger/20 rounded-input px-3 py-2 mb-3">{createErr}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tên lớp *</label>
                <input
                  type="text"
                  placeholder="VD: 12A1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createClass()}
                  className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Khối lớp *</label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Năm học</label>
                <input
                  type="text"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={createClass}
                disabled={creating}
                className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2">
                {creating && (
                  <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                Tạo lớp
              </button>
              <button
                onClick={() => { setShowCreate(false); setCreateErr(null) }}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-btn hover:bg-gray-50 transition-colors">
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        {!loading && classes.length === 0 && !showCreate && (
          <div className="bg-primary/4 border border-primary/15 rounded-card p-5">
            <p className="text-sm font-semibold text-primary mb-2">Cách thức hoạt động</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Tạo lớp học → hệ thống sinh ra <strong>mã tham gia</strong> duy nhất</li>
              <li>Chia sẻ mã cho phụ huynh</li>
              <li>Phụ huynh vào <em>Tham gia lớp</em> và nhập mã → con tự động được thêm vào lớp</li>
              <li>Sau đó bạn có thể giao bài kiểm tra cho lớp</li>
            </ol>
          </div>
        )}

        {/* Classes grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-card animate-pulse motion-safe:animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-card shadow-card">
            <span className="text-5xl">🏫</span>
            <p className="font-display font-bold text-gray-700 text-lg mt-4 mb-2">Chưa có lớp nào</p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">
              Tạo lớp học và chia sẻ mã tham gia cho phụ huynh để họ đăng ký con vào lớp.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-btn hover:bg-primary-dark transition-colors">
              + Tạo lớp đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-card shadow-card p-5 flex flex-col gap-4">
                {/* Class header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-xl">{cls.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Lớp {cls.grade} · {cls.academic_year}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{cls.grade}</span>
                  </div>
                </div>

                {/* Student count */}
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-3xl text-gray-900">{cls.student_count}</span>
                  <span className="text-sm text-gray-400">học sinh</span>
                </div>

                {/* Join code */}
                <div className="bg-gray-50 border border-gray-100 rounded-input p-3">
                  <p className="text-xs text-gray-400 mb-1.5">Mã tham gia lớp</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xl text-gray-900 tracking-[0.2em]">
                      {cls.join_code}
                    </span>
                    <button
                      onClick={() => copyCode(cls.join_code, cls.id)}
                      className={`ml-auto text-xs px-2.5 py-1 rounded-input border transition-colors ${
                        copiedId === cls.id
                          ? 'bg-success/10 border-success/20 text-success font-semibold'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'
                      }`}>
                      {copiedId === cls.id ? '✓ Đã copy' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteClass(cls.id, cls.name)}
                  className="text-xs text-danger border border-danger/20 py-2 rounded-input hover:bg-danger/5 transition-colors">
                  Xoá lớp
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
