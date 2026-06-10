'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { getBrowserClient }    from '../../../../lib/supabase'

interface Child {
  id:          string
  full_name:   string
  grade:       number
  created_at:  string
  avg_score:   number | null
  score_count: number
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

type ModalMode = 'add' | 'edit' | null

export default function ChildrenPage() {
  const router = useRouter()

  const [children,  setChildren]  = useState<Child[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState<ModalMode>(null)
  const [editTarget, setEditTarget] = useState<Child | null>(null)
  const [delTarget,  setDelTarget]  = useState<Child | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Form fields
  const [formName,  setFormName]  = useState('')
  const [formGrade, setFormGrade] = useState(1)

  useEffect(() => { loadChildren() }, [])

  async function loadChildren() {
    setLoading(true)
    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: kids } = await sb
      .from('children')
      .select('id, full_name, grade, created_at')
      .eq('parent_id', user.id)
      .order('created_at')

    const list = (kids ?? []) as Omit<Child, 'avg_score' | 'score_count'>[]

    // Fetch score stats per child
    const enriched = await Promise.all(list.map(async (child) => {
      const { data: scores } = await sb
        .from('score_records')
        .select('score, max_score')
        .eq('child_id', child.id)

      const recs = (scores ?? []) as { score: number; max_score: number }[]
      const avg  = recs.length
        ? recs.reduce<number>((s, r) => s + (r.score / r.max_score) * 10, 0) / recs.length
        : null

      return { ...child, avg_score: avg != null ? Math.round(avg * 10) / 10 : null, score_count: recs.length }
    }))

    setChildren(enriched)
    setLoading(false)
  }

  function openAdd() {
    setFormName(''); setFormGrade(1)
    setEditTarget(null); setError(null); setModal('add')
  }

  function openEdit(child: Child) {
    setFormName(child.full_name)
    setFormGrade(child.grade)
    setEditTarget(child); setError(null); setModal('edit')
  }

  function closeModal() { setModal(null); setEditTarget(null); setError(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) { setError('Vui lòng nhập tên học sinh.'); return }
    setSaving(true); setError(null)

    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    if (modal === 'add') {
      if (children.length >= 5) { setError('Tối đa 5 học sinh trên tài khoản.'); setSaving(false); return }
      const { error: insErr } = await sb.from('children').insert({
        parent_id: user.id,
        full_name: formName.trim(),
        grade:     formGrade,
      })
      if (insErr) { setError('Không thể thêm học sinh. Thử lại nhé.'); setSaving(false); return }
    } else if (modal === 'edit' && editTarget) {
      const { error: updErr } = await sb
        .from('children')
        .update({ full_name: formName.trim(), grade: formGrade })
        .eq('id', editTarget.id)
      if (updErr) { setError('Không thể cập nhật. Thử lại nhé.'); setSaving(false); return }
    }

    setSaving(false); closeModal(); loadChildren()
  }

  async function handleDelete() {
    if (!delTarget) return
    setDeleting(true)

    const sb = getBrowserClient()
    // Cascade: delete score_records, then child
    await sb.from('score_records').delete().eq('child_id', delTarget.id)
    await sb.from('children').delete().eq('id', delTarget.id)

    setDeleting(false); setDelTarget(null); loadChildren()
  }

  const getGradeLabel  = (g: number) => g <= 5 ? `Tiểu học · Lớp ${g}` : g <= 9 ? `THCS · Lớp ${g}` : `THPT · Lớp ${g}`
  const getScoreColor  = (s: number | null) => !s ? 'text-gray-400' : s >= 8 ? 'text-success' : s >= 6.5 ? 'text-warning' : 'text-danger'
  const getAvatarColor = (i: number) => ['bg-primary', 'bg-accent', 'bg-success', 'bg-warning', 'bg-bgh-blue'][i % 5]

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Hồ sơ học sinh</h1>
          <p className="text-sm text-gray-500">Quản lý thông tin và theo dõi tiến độ của từng con.</p>
        </div>
        {children.length < 5 && (
          <button
            onClick={openAdd}
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span> Thêm học sinh
          </button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-card shadow-card p-6 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : children.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/8 flex items-center justify-center mb-4">
              <span className="text-4xl">👦</span>
            </div>
            <h2 className="font-display font-bold text-gray-800 text-xl mb-2">Chưa có học sinh nào</h2>
            <p className="text-gray-500 text-sm max-w-xs mb-6">
              Thêm thông tin con để bắt đầu theo dõi kết quả học tập và nhận tư vấn từ AI.
            </p>
            <button
              onClick={openAdd}
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-btn hover:bg-primary-dark transition-colors"
            >
              + Thêm học sinh đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {children.map((child, i) => (
              <div key={child.id} className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow">
                {/* Card header */}
                <div className="p-5 border-b border-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-full ${getAvatarColor(i)} flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0`}>
                        {child.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-gray-900">{child.full_name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{getGradeLabel(child.grade)}</p>
                      </div>
                    </div>
                    {/* Actions menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(child)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm"
                        title="Chỉnh sửa"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setDelTarget(child)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-danger/8 hover:text-danger transition-colors text-sm"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-5 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Điểm TB</p>
                    <p className={`font-display font-extrabold text-2xl ${getScoreColor(child.avg_score)}`}>
                      {child.avg_score != null ? child.avg_score : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Bài đã nhập</p>
                    <p className="font-display font-extrabold text-2xl text-gray-700">{child.score_count}</p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="px-5 pb-5 flex gap-2">
                  <Link
                    href={`/parent/scores?childId=${child.id}`}
                    className="flex-1 text-center text-xs font-semibold text-primary bg-primary/8 py-2 rounded-lg hover:bg-primary/12 transition-colors"
                  >
                    📊 Bảng điểm
                  </Link>
                  <Link
                    href={`/parent/coach?childId=${child.id}`}
                    className="flex-1 text-center text-xs font-semibold text-accent bg-accent/8 py-2 rounded-lg hover:bg-accent/12 transition-colors"
                  >
                    🤖 AI Coach
                  </Link>
                </div>
              </div>
            ))}

            {/* Add card */}
            {children.length < 5 && (
              <button
                onClick={openAdd}
                className="border-2 border-dashed border-gray-200 rounded-card p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/3 transition-colors group min-h-[200px]"
              >
                <div className="h-12 w-12 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <span className="text-2xl text-gray-400 group-hover:text-primary transition-colors">+</span>
                </div>
                <p className="text-sm font-medium text-gray-400 group-hover:text-primary transition-colors">
                  Thêm học sinh
                </p>
                <p className="text-xs text-gray-300">{5 - children.length} chỗ còn trống</p>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-card shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-display font-bold text-gray-900">
                {modal === 'add' ? 'Thêm học sinh' : `Chỉnh sửa — ${editTarget?.full_name}`}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên học sinh <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Nguyễn Văn B"
                  className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lớp</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormGrade(g)}
                      className={`py-2 rounded-input text-sm font-medium transition-colors ${
                        formGrade === g
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{getGradeLabel(formGrade)}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-btn hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || !formName.trim()}
                  className="flex-1 bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Đang lưu...' : modal === 'add' ? 'Thêm học sinh' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDelTarget(null)} />
          <div className="relative bg-white rounded-card shadow-2xl w-full max-w-sm animate-slide-up p-6 text-center">
            <div className="h-14 w-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="font-display font-bold text-gray-900 mb-2">Xóa học sinh?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Bạn có chắc muốn xóa <strong className="text-gray-800">{delTarget.full_name}</strong>?
              <br />Toàn bộ điểm số sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDelTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-btn hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-danger text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-danger-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
