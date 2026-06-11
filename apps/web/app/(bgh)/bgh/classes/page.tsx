'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrowserClient }                  from '../../../../lib/supabase'
import { SchoolKPIGrid }                     from '../../../../components/bgh/SchoolKPIGrid'
import { ClassRankTable }                    from '../../../../components/bgh/ClassRankTable'

interface ClassRow {
  id:            string
  name:          string
  grade?:        number
  student_count: number
  join_code?:    string
}

interface KPIData {
  school_id:      string
  school_name:    string
  school_code:    string
  total_students: number
  avg_score:      number
  total_classes:  number
  classes:        ClassRow[]
}

interface ClassAvg { [classId: string]: number }
interface Teacher { id: string; full_name: string }

export default function BghClassesPage() {
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
  const [copiedId,  setCopiedId]  = useState<string | null>(null)

  // Gán giáo viên chủ nhiệm
  const [teachers,     setTeachers]     = useState<Teacher[]>([])
  const [classTeacher, setClassTeacher] = useState<Record<string, string | null>>({})
  const [assigningId,  setAssigningId]  = useState<string | null>(null)

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/v1/bgh/kpi')
    if (!res.ok) { setError('Không tải được dữ liệu. Bạn có quyền truy cập BGH không?'); setLoading(false); return }
    const json = await res.json() as { data: KPIData }
    setKpi(json.data)

    const sb = getBrowserClient()

    // Danh sách giáo viên thuộc trường + GV chủ nhiệm hiện tại của từng lớp
    const [{ data: teacherRows }, { data: classRows }] = await Promise.all([
      sb.from('profiles').select('id, full_name').eq('school_id', json.data.school_id).eq('role', 'teacher'),
      (sb as any).from('classes').select('id, teacher_id').eq('school_id', json.data.school_id),
    ])
    setTeachers((teacherRows ?? []) as Teacher[])
    const ct: Record<string, string | null> = {}
    for (const c of (classRows ?? []) as { id: string; teacher_id: string | null }[]) ct[c.id] = c.teacher_id
    setClassTeacher(ct)

    // Compute avg score per class via class_memberships + score_records
    if (json.data.classes.length > 0) {
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
    setError(null)

    const res = await fetch('/api/v1/bgh/classes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: newName.trim(), grade: newGrade, academicYear: newYear }),
    })

    setSaving(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError((err as { error?: string }).error ?? 'Không thể thêm lớp. Thử lại nhé.')
      return
    }

    setShowModal(false)
    setNewName('')
    await load()   // KPI cache đã được server xóa → lớp mới hiện ra
  }

  async function assignTeacher(classId: string, teacherId: string) {
    setAssigningId(classId)
    setError(null)
    const sb = getBrowserClient()
    // RLS "classes: bgh manage school" cho phép BGH đổi teacher_id lớp trong trường
    const { error: updErr } = await sb
      .from('classes')
      .update({ teacher_id: teacherId })
      .eq('id', classId)
    setAssigningId(null)
    if (updErr) { setError('Không thể gán giáo viên. Thử lại nhé.'); return }
    setClassTeacher((prev) => ({ ...prev, [classId]: teacherId }))
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

        {/* Mã trường — phát cho giáo viên để họ tham gia trường */}
        {!loading && kpi?.school_code && (
          <div className="bg-[#185FA5]/5 border border-[#185FA5]/15 rounded-card p-5 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-semibold text-gray-900">Mã trường (cho giáo viên)</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Gửi mã này cho giáo viên → họ vào “Tham gia trường” nhập mã → bạn mới gán được họ làm chủ nhiệm lớp.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono font-bold text-xl text-[#185FA5] tracking-[0.2em] bg-white border border-[#185FA5]/20 rounded-input px-4 py-2">
                {kpi.school_code}
              </span>
              <button
                onClick={() => copyCode(kpi.school_code, 'school')}
                className={`text-xs px-3 py-2 rounded-input border transition-colors ${
                  copiedId === 'school'
                    ? 'bg-success/10 border-success/20 text-success font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#185FA5]/40 hover:text-[#185FA5]'
                }`}>
                {copiedId === 'school' ? '✓ Đã copy' : '📋 Copy'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="h-64 bg-gray-100 rounded-card animate-pulse" />
        ) : (
          <ClassRankTable classes={classesWithAvg} />
        )}

        {/* Mã tham gia lớp — phát cho phụ huynh để học sinh vào lớp */}
        {!loading && (kpi?.classes.length ?? 0) > 0 && (
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-800">Mã tham gia lớp</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Gửi mã cho phụ huynh → phụ huynh vào “Tham gia lớp” nhập mã → học sinh vào lớp (sĩ số tự cập nhật)
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {(kpi?.classes ?? []).map((cls) => (
                <div key={cls.id} className="px-6 py-3.5 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-semibold text-gray-900">
                      {cls.name}
                      {cls.grade != null && (
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">Lớp {cls.grade}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{cls.student_count} học sinh</p>
                  </div>

                  {/* Gán giáo viên chủ nhiệm */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-gray-400">GVCN:</span>
                    <select
                      value={classTeacher[cls.id] ?? ''}
                      disabled={assigningId === cls.id}
                      onChange={(e) => e.target.value && assignTeacher(cls.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-input px-2 py-1.5 bg-white max-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 disabled:opacity-50">
                      <option value="">— Chọn GV —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.full_name}</option>
                      ))}
                    </select>
                  </div>

                  {cls.join_code ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono font-bold text-base text-gray-900 tracking-[0.18em] bg-gray-50 border border-gray-100 rounded-input px-3 py-1.5">
                        {cls.join_code}
                      </span>
                      <button
                        onClick={() => copyCode(cls.join_code!, cls.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-input border transition-colors ${
                          copiedId === cls.id
                            ? 'bg-success/10 border-success/20 text-success font-semibold'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-[#185FA5]/40 hover:text-[#185FA5]'
                        }`}>
                        {copiedId === cls.id ? '✓ Đã copy' : '📋 Copy'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300 flex-shrink-0">Chưa có mã</span>
                  )}
                </div>
              ))}
            </div>
            {teachers.length === 0 && (
              <div className="px-6 py-3 bg-warning/5 border-t border-warning/15 text-xs text-warning">
                Chưa có giáo viên nào trong trường. Gửi <strong>mã trường</strong> ở trên cho giáo viên để họ tham gia, rồi mới gán chủ nhiệm được.
              </div>
            )}
          </div>
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
