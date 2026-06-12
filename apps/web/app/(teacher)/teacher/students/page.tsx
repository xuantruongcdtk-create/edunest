'use client'

import { useState, useEffect, useCallback } from 'react'
import Link                                  from 'next/link'
import { getBrowserClient }                  from '../../../../lib/supabase'
import { useUser }                           from '../../../../lib/user-context'

// ── Types ──────────────────────────────────────────────────────────────────
interface Student {
  id:       string
  full_name: string
  grade:    number
  subjects: string[]
  avgScore: number | null
  scoreCount: number
}

const SUBJ: Record<string, string> = {
  math:'Toán', literature:'Văn', english:'Anh', physics:'Lý',
  chemistry:'Hóa', biology:'Sinh', history:'Sử', geography:'Địa',
  civics:'GDCD', informatics:'Tin học',
}

const GRADE_COLORS = [
  'bg-primary/10 text-primary', 'bg-accent/10 text-accent',
  'bg-success/10 text-success', 'bg-warning/10 text-warning',
]

function avgColor(n: number | null) {
  if (n === null) return 'text-gray-400'
  if (n >= 8)   return 'text-success'
  if (n >= 6.5) return 'text-primary'
  if (n >= 5)   return 'text-warning'
  return 'text-danger'
}
function avgLabel(n: number | null) {
  if (n === null) return '—'
  if (n >= 8)   return 'Giỏi'
  if (n >= 6.5) return 'Khá'
  if (n >= 5)   return 'TB'
  return 'Yếu'
}
function labelColor(n: number | null) {
  if (n === null) return 'bg-gray-100 text-gray-400'
  if (n >= 8)   return 'bg-success/10 text-success'
  if (n >= 6.5) return 'bg-primary/10 text-primary'
  if (n >= 5)   return 'bg-warning/10 text-warning'
  return 'bg-danger/10 text-danger'
}

export default function TeacherStudentsPage() {
  const { userId } = useUser()

  const [students,  setStudents]  = useState<Student[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filterSubj, setFilterSubj] = useState('all')
  const [viewMode,  setViewMode]  = useState<'grid' | 'table'>('table')

  const loadStudents = useCallback(async () => {
    setLoading(true)
    const sb = getBrowserClient()

    // Lớp do giáo viên này chủ nhiệm
    const { data: classData } = await (sb as any)
      .from('classes')
      .select('id, name')
      .eq('teacher_id', userId)

    const classList = (classData ?? []) as { id: string; name: string }[]
    if (classList.length === 0) { setStudents([]); setLoading(false); return }

    const classIds      = classList.map((c) => c.id)
    const classNameById = Object.fromEntries(classList.map((c) => [c.id, c.name]))

    // Học sinh đã tham gia các lớp đó (qua class_memberships)
    const { data: cmData } = await (sb as any)
      .from('class_memberships')
      .select('class_id, children!inner(id, full_name, grade)')
      .in('class_id', classIds)

    if (!cmData || cmData.length === 0) { setStudents([]); setLoading(false); return }

    // Gom theo học sinh; lưu tên LỚP vào trường subjects để hiển thị nhãn
    const childMap = new Map<string, { id: string; full_name: string; grade: number; subjects: string[] }>()
    for (const row of cmData as { class_id: string; children: { id: string; full_name: string; grade: number } | null }[]) {
      const c = row.children
      if (!c) continue
      if (!childMap.has(c.id)) childMap.set(c.id, { id: c.id, full_name: c.full_name, grade: c.grade, subjects: [] })
      const className = classNameById[row.class_id]
      if (className && !childMap.get(c.id)!.subjects.includes(className)) childMap.get(c.id)!.subjects.push(className)
    }
    const childIds = Array.from(childMap.keys())

    // Fetch scores for all children
    const { data: scoreData } = await sb
      .from('score_records')
      .select('child_id, score, max_score')
      .in('child_id', childIds)

    // Calculate avg per child
    const avgMap: Record<string, { sum: number; count: number }> = {}
    for (const s of (scoreData ?? []) as { child_id: string; score: number; max_score: number }[]) {
      if (!avgMap[s.child_id]) avgMap[s.child_id] = { sum: 0, count: 0 }
      avgMap[s.child_id]!.sum   += (s.score / s.max_score) * 10
      avgMap[s.child_id]!.count += 1
    }

    const result: Student[] = Array.from(childMap.values()).map((c) => {
      const entry = avgMap[c.id]
      return {
        ...c,
        avgScore:   entry ? entry.sum / entry.count : null,
        scoreCount: entry?.count ?? 0,
      }
    })

    result.sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1))
    setStudents(result)
    setLoading(false)
  }, [userId])

  useEffect(() => { loadStudents() }, [loadStudents])

  const allSubjects = Array.from(new Set(students.flatMap((s) => s.subjects)))

  const filtered = students.filter((s) => {
    const matchName = search === '' || s.full_name.toLowerCase().includes(search.toLowerCase())
    const matchSubj = filterSubj === 'all' || s.subjects.includes(filterSubj)
    return matchName && matchSubj
  })

  const stats = {
    total:    students.length,
    withData: students.filter((s) => s.avgScore !== null).length,
    avgAll:   students.length > 0
      ? students.filter((s) => s.avgScore !== null).reduce((a, s) => a + (s.avgScore ?? 0), 0)
        / (students.filter((s) => s.avgScore !== null).length || 1)
      : 0,
    weak: students.filter((s) => s.avgScore !== null && s.avgScore < 5).length,
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Học sinh</h1>
          <p className="text-sm text-gray-500">Danh sách học sinh bạn đang theo dõi</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-input text-sm transition-colors ${viewMode === 'table' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
            ☰ Bảng
          </button>
          <button onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-input text-sm transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
            ⊞ Lưới
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng học sinh',   value: stats.total,                                    color: 'text-gray-900' },
            { label: 'Điểm TB lớp',     value: stats.avgAll > 0 ? stats.avgAll.toFixed(1) : '—', color: 'text-primary' },
            { label: 'Có dữ liệu điểm', value: stats.withData,                                color: 'text-success' },
            { label: 'Cần chú ý (< 5)', value: stats.weak,                                    color: stats.weak > 0 ? 'text-danger' : 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-card shadow-card p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`font-display font-extrabold text-2xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên học sinh..."
              className="w-full border border-gray-200 rounded-input pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          {allSubjects.length > 0 && (
            <select value={filterSubj} onChange={(e) => setFilterSubj(e.target.value)}
              className="border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">Tất cả lớp</option>
              {allSubjects.map((s) => <option key={s} value={s}>{SUBJ[s] ?? s}</option>)}
            </select>
          )}

          {(search || filterSubj !== 'all') && (
            <button onClick={() => { setSearch(''); setFilterSubj('all') }}
              className="text-xs text-gray-500 hover:text-primary">× Xóa bộ lọc</button>
          )}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} học sinh</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-card shadow-card py-20 text-center">
            <span className="text-5xl">👥</span>
            <p className="font-display font-bold text-gray-700 text-lg mt-4 mb-2">
              {students.length === 0 ? 'Chưa có học sinh nào' : 'Không có kết quả'}
            </p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {students.length === 0
                ? 'Học sinh xuất hiện khi phụ huynh nhập mã lớp của bạn để cho con vào lớp. Bạn cần là giáo viên chủ nhiệm của lớp.'
                : 'Thử thay đổi bộ lọc.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* ── Table view ── */
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Học sinh', 'Khối', 'Lớp', 'Điểm TB', 'Lần nhập', 'Trạng thái', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${GRADE_COLORS[idx % GRADE_COLORS.length]}`}>
                            {s.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">Khối {s.grade}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.subjects.length === 0
                            ? <span className="text-xs text-gray-400">—</span>
                            : s.subjects.map((subj) => (
                              <span key={subj} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {SUBJ[subj] ?? subj}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold tabular-nums ${avgColor(s.avgScore)}`}>
                          {s.avgScore !== null ? s.avgScore.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.scoreCount}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${labelColor(s.avgScore)}`}>
                          {avgLabel(s.avgScore)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/teacher/quiz?student=${s.id}`}
                          className="text-xs text-primary hover:underline whitespace-nowrap">
                          Giao quiz →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Grid view ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s, idx) => (
              <div key={s.id} className="bg-white rounded-card shadow-card p-4 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${GRADE_COLORS[idx % GRADE_COLORS.length]}`}>
                    {s.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.full_name}</p>
                    <p className="text-xs text-gray-400">Khối {s.grade}{s.subjects.length > 0 ? ` · ${s.subjects.join(', ')}` : ''}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${labelColor(s.avgScore)}`}>
                    {avgLabel(s.avgScore)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Điểm TB</p>
                    <p className={`font-bold text-lg ${avgColor(s.avgScore)}`}>
                      {s.avgScore !== null ? s.avgScore.toFixed(1) : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Lần nhập</p>
                    <p className="font-bold text-lg text-gray-700">{s.scoreCount}</p>
                  </div>
                </div>

                {s.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-50">
                    {s.subjects.map((subj) => (
                      <span key={subj} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {SUBJ[subj] ?? subj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
