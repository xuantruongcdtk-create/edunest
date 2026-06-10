'use client'

import { useState, useEffect, useCallback } from 'react'
import { SchoolKPIGrid }                     from '../../../../components/bgh/SchoolKPIGrid'

interface KPIData {
  school_id:      string
  school_name:    string
  total_students: number
  avg_score:      number
  total_classes:  number
  classes:        { id: string; name: string; student_count: number }[]
}

const SUBJ: Record<string, string> = {
  math:'Toán', literature:'Văn', english:'Anh', physics:'Lý',
  chemistry:'Hóa', biology:'Sinh', history:'Sử', geography:'Địa',
  civics:'GDCD', informatics:'Tin học',
}

function scoreColor(n: number) {
  if (n >= 8) return 'bg-success'
  if (n >= 6.5) return 'bg-primary'
  if (n >= 5) return 'bg-warning'
  return 'bg-danger'
}
function scoreTextColor(n: number) {
  if (n >= 8) return 'text-success'
  if (n >= 6.5) return 'text-primary'
  if (n >= 5) return 'text-warning'
  return 'text-danger'
}

export default function BghReportsPage() {
  const [kpi,        setKpi]        = useState<KPIData | null>(null)
  const [subjScores, setSubjScores] = useState<{ subject: string; avg: number; count: number }[]>([])
  const [distribution, setDist]    = useState<{ label: string; count: number; color: string }[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const kpiRes = await fetch('/api/v1/bgh/kpi')
    if (!kpiRes.ok) { setError('Không tải được dữ liệu trường.'); setLoading(false); return }
    const kpiJson = await kpiRes.json() as { data: KPIData }
    setKpi(kpiJson.data)

    // Dynamically import to avoid server-side issues
    const { getBrowserClient } = await import('../../../../lib/supabase')
    const sb = getBrowserClient()

    // Get all children in this school
    const { data: children } = await sb
      .from('children')
      .select('id')
      .eq('school_id', kpiJson.data.school_id)

    if (!children || children.length === 0) { setLoading(false); return }
    const childIds = (children as { id: string }[]).map((c) => c.id)

    // Get score records
    const { data: scores } = await sb
      .from('score_records')
      .select('child_id, subject, score, max_score')
      .in('child_id', childIds)

    if (!scores || scores.length === 0) { setLoading(false); return }

    // By subject
    const bySubj: Record<string, { sum: number; n: number }> = {}
    for (const s of scores as { subject: string; score: number; max_score: number }[]) {
      const norm = (s.score / s.max_score) * 10
      if (!bySubj[s.subject]) bySubj[s.subject] = { sum: 0, n: 0 }
      bySubj[s.subject]!.sum += norm
      bySubj[s.subject]!.n  += 1
    }
    setSubjScores(
      Object.entries(bySubj)
        .map(([subject, { sum, n }]) => ({ subject, avg: sum / n, count: n }))
        .sort((a, b) => b.avg - a.avg)
    )

    // Score distribution
    const buckets = { excellent: 0, good: 0, avg: 0, weak: 0 }
    for (const s of scores as { score: number; max_score: number }[]) {
      const norm = (s.score / s.max_score) * 10
      if (norm >= 8.5) buckets.excellent++
      else if (norm >= 7) buckets.good++
      else if (norm >= 5) buckets.avg++
      else buckets.weak++
    }
    const total = scores.length
    setDist([
      { label: 'Xuất sắc (≥8.5)',  count: buckets.excellent, color: 'bg-success' },
      { label: 'Khá (7–8.4)',       count: buckets.good,      color: 'bg-primary' },
      { label: 'Trung bình (5–6.9)', count: buckets.avg,      color: 'bg-warning' },
      { label: 'Yếu (<5)',          count: buckets.weak,       color: 'bg-danger' },
    ].map((b) => ({ ...b, pct: total > 0 ? (b.count / total) * 100 : 0 })))

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Báo cáo trường</h1>
          <p className="text-sm text-gray-500">{kpi?.school_name ?? 'Đang tải...'}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-btn hover:bg-gray-50 transition-colors">
          🖨 In báo cáo
        </button>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-4 py-3">{error}</div>
        )}

        {/* School KPI */}
        <SchoolKPIGrid
          kpi={kpi ? { total_students: kpi.total_students, avg_score: kpi.avg_score, total_classes: kpi.total_classes, school_name: kpi.school_name } : null}
          loading={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Subject breakdown */}
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900">Điểm TB theo môn</h3>
              <p className="text-xs text-gray-400 mt-0.5">Toàn trường, tất cả lớp</p>
            </div>
            {loading ? (
              <div className="p-5 space-y-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}</div>
            ) : subjScores.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">Chưa có dữ liệu điểm</div>
            ) : (
              <div className="p-5 space-y-3">
                {subjScores.map(({ subject, avg, count }) => (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{SUBJ[subject] ?? subject}</span>
                        <span className="text-xs text-gray-400">{count} lần</span>
                      </div>
                      <span className={`font-bold text-sm tabular-nums ${scoreTextColor(avg)}`}>{avg.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${scoreColor(avg)}`} style={{ width: `${(avg / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score distribution */}
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900">Phân bổ xếp loại</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tỷ lệ % số điểm theo thang</p>
            </div>
            {loading ? (
              <div className="p-5 space-y-4 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}</div>
            ) : distribution.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
            ) : (
              <div className="p-5 space-y-4">
                {(distribution as (typeof distribution[0] & { pct?: number })[]).map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700">{b.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{b.count} lần</span>
                        <span className="text-sm font-bold text-gray-900">{(b.pct ?? 0).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${b.color}`} style={{ width: `${b.pct ?? 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Classes summary */}
        {!loading && kpi && kpi.classes.length > 0 && (
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900">Thống kê theo lớp</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Lớp', 'Sĩ số', 'Trạng thái'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {kpi.classes.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-900">{cls.name}</td>
                      <td className="px-5 py-3 text-gray-600">{cls.student_count} học sinh</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls.student_count > 0 ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'}`}>
                          {cls.student_count > 0 ? 'Hoạt động' : 'Trống'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
