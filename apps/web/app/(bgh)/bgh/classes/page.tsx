'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrowserClient }                  from '../../../../lib/supabase'
import { SchoolKPIGrid }                     from '../../../../components/bgh/SchoolKPIGrid'
import { ClassRankTable }                    from '../../../../components/bgh/ClassRankTable'
import { useUser }                           from '../../../../lib/user-context'

interface KPIData {
  school_id:      string
  school_name:    string
  total_students: number
  avg_score:      number
  total_classes:  number
  classes:        { id: string; name: string; student_count: number }[]
}

interface ClassAvg { [classId: string]: number }

export default function BghClassesPage() {
  const { userId } = useUser()

  const [kpi,       setKpi]       = useState<KPIData | null>(null)
  const [classAvgs, setClassAvgs] = useState<ClassAvg>({})
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // New class modal
  const [showModal, setShowModal] = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newGrade,  setNewGrade]  = useState(10)
  const [newYear,   setNewYear]   = useState('2025-2026')
  const [saving,    setSaving]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/v1/bgh/kpi')
    if (!res.ok) { setError('Không tải được dữ liệu. Bạn có quyền truy cập BGH không?'); setLoading(false); return }
    const json = await res.json() as { data: KPIData }
    setKpi(json.data)

    // Compute avg score per class via class_memberships + score_records
    if (json.data.classes.length > 0) {
      const sb = getBrowserClient()
      const classIds = json.data.classes.map((c) => c.id)

      // Get all child_ids per class
      const { data: memberships } = await sb
        .from('class_memberships')
        .select('class_id, child_id')
        .in('class_id', classIds)

      if (memberships && memberships.length > 0) {
        const childIds = Array.from(new Set(memberships.map((m: { child_id: string }) => m.child_id)))
        const { data: scores } = await sb
          .from('score_records')
          .select('child_id, score, max_score')
          .in('child_id', childIds)

        // child_id → avg score
        const childAvg: Record<string, { sum: number; n: number }> = {}
        for (const s of (scores ?? []) as { child_id: string; score: number; max_score: number }[]) {
          if (!childAvg[s.child_id]) childAvg[s.child_id] = { sum: 0, n: 0 }
          childAvg[s.child_id]!.sum += (s.score / s.max_score) * 10
          childAvg[s.child_id]!.n  += 1
        }

        // class_id → avg score
        const avgs: ClassAvg = {}
        for (const classId of classIds) {
          const children = memberships
            .filter((m: { class_id: string; child_id: string }) => m.class_id === classId)
            .map((m: { child_id: string }) => m.child_id)
          if (children.length === 0) continue
          const total = children.reduce((s: number, cid: string) => {
            const c = childAvg[cid]
            return s + (c ? c.sum / c.n : 0)
          }, 0)
          avgs[classId] = total / children.length
        }
        setClassAvgs(avgs)
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault()
    if (!kpi) return
    setSaving(true)

    const sb = getBrowserClient()

    await sb.from('classes').insert({
      school_id:    kpi.school_id,
      teacher_id:   userId,
      name:         newName.trim(),
      grade:        newGrade,
      academic_year: newYear,
    })

    setSaving(false)
    setShowModal(false)
    setNewName('')
    load()
  }

  const classesWithAvg = (kpi?.classes ?? []).map((c) => ({
    ...c,
    avg_score: classAvgs[c.id],
  }))

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Lớp học</h1>
          <p className="text-sm text-gray-500">{kpi?.school_name ?? 'Đang tải...'}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-[#185FA5] text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-[#124e8a] transition-colors">
          + Thêm lớp
        </button>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-4 py-3">{error}</div>
        )}

        <SchoolKPIGrid
          kpi={kpi ? { total_students: kpi.total_students, avg_score: kpi.avg_score, total_classes: kpi.total_classes, school_name: kpi.school_name } : null}
          loading={loading}
        />

        {loading ? (
          <div className="h-64 bg-gray-100 rounded-card animate-pulse" />
        ) : (
          <ClassRankTable classes={classesWithAvg} />
        )}
      </div>

      {/* Add class modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-card shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-display font-bold text-gray-900">Thêm lớp học mới</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <form onSubmit={handleAddClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên lớp</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required
                  placeholder="VD: 12A1, 10B3..."
                  className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Khối</label>
                  <select value={newGrade} onChange={(e) => setNewGrade(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-input px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Năm học</label>
                  <input type="text" value={newYear} onChange={(e) => setNewYear(e.target.value)} required
                    placeholder="2025-2026"
                    className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30" />
                </div>
              </div>
              <button type="submit" disabled={saving || !newName.trim()}
                className="w-full bg-[#185FA5] text-white text-sm font-bold py-2.5 rounded-btn hover:bg-[#124e8a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {saving ? 'Đang lưu...' : 'Thêm lớp'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
