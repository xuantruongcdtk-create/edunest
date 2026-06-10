'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams }     from 'next/navigation'
import { getBrowserClient }               from '../../../../lib/supabase'

interface ScoreRecord {
  id:           string
  subject:      string
  score:        number
  max_score:    number
  exam_type:    string
  exam_date:    string
  semester:     number
}

interface Child { id: string; full_name: string; grade: number }

const SUBJECTS   = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'GDCD', 'Tin học', 'Thể dục', 'Âm nhạc', 'Mỹ thuật']
const EXAM_TYPES = [
  { value: 'oral',       label: 'Kiểm tra miệng' },
  { value: 'quiz_15',    label: 'Kiểm tra 15 phút' },
  { value: 'midterm',    label: 'Kiểm tra 45 phút' },
  { value: 'final',      label: 'Thi học kỳ' },
]

function getAcademicYear() {
  const now = new Date()
  const y   = now.getFullYear()
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

function ScoresPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const urlChildId   = searchParams.get('childId') ?? undefined

  const [children,   setChildren]   = useState<Child[]>([])
  const [activeId,   setActiveId]   = useState<string | undefined>(urlChildId)
  const [scores,     setScores]     = useState<ScoreRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Form state
  const [subject,   setSubject]   = useState(SUBJECTS[0]!)
  const [score,     setScore]     = useState('')
  const [maxScore,  setMaxScore]  = useState('10')
  const [examType,  setExamType]  = useState('midterm')
  const [examDate,  setExamDate]  = useState(new Date().toISOString().slice(0, 10))
  const [semester,  setSemester]  = useState(1)

  useEffect(() => {
    async function load() {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: kids } = await sb
        .from('children')
        .select('id, full_name, grade')
        .eq('parent_id', user.id)
        .order('created_at')

      const childList = (kids ?? []) as Child[]
      setChildren(childList)

      const cid = urlChildId ?? childList[0]?.id
      setActiveId(cid)
    }
    load()
  }, [router, urlChildId])

  useEffect(() => {
    if (!activeId) return
    fetchScores(activeId)
  }, [activeId])

  async function fetchScores(childId: string) {
    setLoading(true)
    const sb = getBrowserClient()
    const { data } = await sb
      .from('score_records')
      .select('id, subject, score, max_score, exam_type, exam_date, semester')
      .eq('child_id', childId)
      .eq('academic_year', getAcademicYear())
      .order('exam_date', { ascending: false })

    setScores((data ?? []) as ScoreRecord[])
    setLoading(false)
  }

  async function handleAddScore(e: React.FormEvent) {
    e.preventDefault()
    if (!activeId) return
    const s = parseFloat(score)
    const m = parseFloat(maxScore)
    if (isNaN(s) || isNaN(m) || s < 0 || s > m) {
      setError(`Điểm phải từ 0–${m}.`); return
    }

    setSaving(true); setError(null)
    const sb = getBrowserClient()
    const { error: insErr } = await sb.from('score_records').insert({
      child_id:      activeId,
      subject,
      score:         s,
      max_score:     m,
      exam_type:     examType,
      exam_date:     examDate,
      semester,
      academic_year: getAcademicYear(),
    })

    setSaving(false)
    if (insErr) { setError('Không thể lưu điểm. Thử lại nhé.'); return }
    setScore(''); setShowForm(false)
    fetchScores(activeId)
  }

  const activeChild = children.find((c) => c.id === activeId)

  // Group by subject
  const bySubject = scores.reduce<Record<string, ScoreRecord[]>>((acc, s) => {
    (acc[s.subject] ??= []).push(s)
    return acc
  }, {})

  const avgBySubject = Object.entries(bySubject).map(([subj, recs]) => ({
    subject: subj,
    avg: recs.reduce((sum, r) => sum + (r.score / r.max_score) * 10, 0) / recs.length,
    count: recs.length,
  })).sort((a, b) => b.avg - a.avg)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Bảng điểm</h1>
          {activeChild && <p className="text-sm text-gray-500">{activeChild.full_name} · Lớp {activeChild.grade} · {getAcademicYear()}</p>}
        </div>
        <div className="flex items-center gap-3">
          {children.length > 1 && (
            <select
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              className="border border-gray-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              {children.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <span>+</span> Nhập điểm
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Add score form */}
        {showForm && (
          <div className="bg-white rounded-card shadow-card p-6 border border-primary/20">
            <h2 className="font-display font-bold text-gray-900 mb-4">Nhập điểm mới</h2>
            {error && <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2 mb-4">{error}</div>}
            <form onSubmit={handleAddScore}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Môn học</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Loại kiểm tra</label>
                  <select value={examType} onChange={(e) => setExamType(e.target.value)}
                    className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {EXAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Học kỳ</label>
                  <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Điểm đạt</label>
                  <input type="number" min={0} max={parseFloat(maxScore)} step={0.1} value={score}
                    onChange={(e) => setScore(e.target.value)} required placeholder="8.5"
                    className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Thang điểm</label>
                  <input type="number" min={1} max={100} step={1} value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ngày kiểm tra</label>
                  <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setError(null) }}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-btn hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={saving || !score}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Đang lưu...' : 'Lưu điểm'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary cards */}
        {avgBySubject.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {avgBySubject.map(({ subject: subj, avg, count }) => (
              <div key={subj} className="bg-white rounded-card shadow-card p-4">
                <p className="text-xs text-gray-500 mb-1">{subj}</p>
                <p className={`font-display font-extrabold text-2xl ${avg >= 8 ? 'text-success' : avg >= 6.5 ? 'text-warning' : 'text-danger'}`}>
                  {avg.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{count} bài · TB /10</p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${avg >= 8 ? 'bg-success' : avg >= 6.5 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${avg * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Score table */}
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-display font-semibold text-gray-900">Lịch sử điểm</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : scores.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl">📊</span>
              <p className="text-gray-500 text-sm mt-3">Chưa có điểm nào. Nhấn "+ Nhập điểm" để bắt đầu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Môn học','Loại','Điểm','Thang','Quy 10','Học kỳ','Ngày'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {scores.map((s) => {
                    const norm = (s.score / s.max_score) * 10
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{s.subject}</td>
                        <td className="px-4 py-3 text-gray-500">{EXAM_TYPES.find((t) => t.value === s.exam_type)?.label ?? s.exam_type}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{s.score}</td>
                        <td className="px-4 py-3 text-gray-400">{s.max_score}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${norm >= 8 ? 'text-success' : norm >= 6.5 ? 'text-warning' : 'text-danger'}`}>
                            {norm.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">HK{s.semester}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(s.exam_date).toLocaleDateString('vi-VN')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ScoresPage() {
  return <Suspense><ScoresPageInner /></Suspense>
}
