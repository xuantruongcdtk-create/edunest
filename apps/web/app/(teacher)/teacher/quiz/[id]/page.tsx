'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import Link                                  from 'next/link'
import { getBrowserClient }                  from '../../../../../lib/supabase'

interface Question {
  id:            string
  question_text: string
  question_type: 'mcq' | 'essay'
  options:       string[]
  correct_index: number | null
  sample_answer: string | null
  explanation:   string | null
  order_index:   number
}

interface QuizDetail {
  id:                 string
  title:              string
  subject:            string
  grade:              number
  difficulty:         'easy' | 'medium' | 'hard'
  status:             'draft' | 'published' | 'archived'
  question_count:     number
  time_limit_minutes: number
  ai_generated:       boolean
  due_date:           string | null
  created_at:         string
  questions:          Question[]
}

interface ClassItem {
  id:            string
  name:          string
  grade:         number
  student_count: number
}

interface Assignment {
  id:       string
  class_id: string
  due_date: string | null
  class:    ClassItem
}

const SUBJ_LABEL: Record<string, string> = {
  math: 'Toán', literature: 'Văn', english: 'Anh', physics: 'Lý',
  chemistry: 'Hóa', biology: 'Sinh', history: 'Sử', geography: 'Địa',
  civics: 'GDCD', informatics: 'Tin học',
}
const DIFF_CONFIG = {
  easy:   { label: 'Dễ',  color: 'bg-success/10 text-success' },
  medium: { label: 'TB',  color: 'bg-warning/10 text-warning' },
  hard:   { label: 'Khó', color: 'bg-danger/10 text-danger' },
}
const STATUS_CONFIG = {
  draft:     { label: 'Nháp',    color: 'bg-gray-100 text-gray-500' },
  published: { label: 'Đã đăng', color: 'bg-primary/10 text-primary' },
  archived:  { label: 'Lưu trữ', color: 'bg-gray-100 text-gray-400' },
}
const OPTS = ['A', 'B', 'C', 'D']

export default function QuizDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router  = useRouter()

  const [quiz,          setQuiz]          = useState<QuizDetail | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [updating,      setUpdating]      = useState(false)
  const [statusMsg,     setStatusMsg]     = useState<string | null>(null)
  const [expandedQ,     setExpandedQ]     = useState<Set<string>>(new Set())

  // Assignment state
  const [classes,        setClasses]        = useState<ClassItem[]>([])
  const [assignments,    setAssignments]    = useState<Assignment[]>([])
  const [assignLoading,  setAssignLoading]  = useState(true)
  const [pendingClassId, setPendingClassId] = useState<string | null>(null)
  const [pendingDueDate, setPendingDueDate] = useState<string>('')
  const [assignMsg,      setAssignMsg]      = useState<string | null>(null)
  const [assignErr,      setAssignErr]      = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const sb = getBrowserClient()
        const { data: { user } } = await sb.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: quizData, error } = await sb
          .from('quizzes')
          .select('id, title, subject, grade, difficulty, status, question_count, time_limit_minutes, ai_generated, due_date, created_at')
          .eq('id', id)
          .eq('teacher_id', user.id)
          .single()

        if (error || !quizData) { setNotFound(true); setLoading(false); return }

        const { data: questions } = await sb
          .from('quiz_questions')
          .select('id, question_text, question_type, options, correct_index, sample_answer, explanation, order_index')
          .eq('quiz_id', id)
          .order('order_index', { ascending: true })

        setQuiz({
          ...(quizData as Omit<QuizDetail, 'questions'>),
          questions: (questions ?? []) as Question[],
        })
        setLoading(false)
      } catch {
        setNotFound(true)
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const loadAssignments = useCallback(async () => {
    setAssignLoading(true)
    try {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return

      const [{ data: classData }, { data: assignData }] = await Promise.all([
        sb.from('classes')
          .select('id, name, grade, student_count')
          .eq('teacher_id', user.id)
          .order('grade', { ascending: true }),
        (sb as any)
          .from('quiz_assignments')
          .select('id, class_id, due_date, class:classes!class_id(id, name, grade, student_count)')
          .eq('quiz_id', id),
      ])

      setClasses((classData ?? []) as ClassItem[])
      setAssignments((assignData ?? []) as Assignment[])
    } finally {
      setAssignLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  async function updateStatus(newStatus: 'published' | 'archived' | 'draft') {
    if (!quiz) return
    setUpdating(true); setStatusMsg(null)

    const sb = getBrowserClient()
    const { error } = await sb
      .from('quizzes')
      .update({ status: newStatus })
      .eq('id', id)

    setUpdating(false)
    if (error) { setStatusMsg('Cập nhật thất bại.'); return }
    setQuiz((prev) => prev ? { ...prev, status: newStatus } : prev)
    setStatusMsg(
      newStatus === 'published' ? '✓ Đã đăng bài'
      : newStatus === 'archived' ? '✓ Đã lưu trữ'
      : '✓ Chuyển về nháp',
    )
    setTimeout(() => setStatusMsg(null), 3000)
  }

  async function deleteQuiz() {
    if (!quiz) return
    const confirmed = window.confirm(`Xoá bài "${quiz.title}"? Hành động này không thể hoàn tác.`)
    if (!confirmed) return

    setUpdating(true)
    const sb = getBrowserClient()
    await sb.from('quiz_questions').delete().eq('quiz_id', id)
    await sb.from('quizzes').delete().eq('id', id)
    router.push('/teacher/quiz')
  }

  async function assignToClass(classId: string, dueDate: string | null) {
    setUpdating(true); setAssignErr(null)
    try {
      const res = await fetch(`/api/v1/quiz/${id}/assign`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ classId, dueDate: dueDate || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setAssignErr((err as { error?: { message?: string } }).error?.message ?? 'Giao bài thất bại')
        return
      }
      await loadAssignments()
      setPendingClassId(null)
      setPendingDueDate('')
      setAssignMsg('✓ Đã giao bài')
      setTimeout(() => setAssignMsg(null), 3000)
    } finally {
      setUpdating(false)
    }
  }

  async function unassignFromClass(classId: string) {
    const cls = classes.find((c) => c.id === classId)
    if (!window.confirm(`Bỏ giao bài khỏi lớp "${cls?.name ?? ''}"?`)) return
    setUpdating(true)
    try {
      await fetch(`/api/v1/quiz/${id}/assign?classId=${classId}`, { method: 'DELETE' })
      setAssignments((prev) => prev.filter((a) => a.class_id !== classId))
      setAssignMsg('✓ Đã bỏ giao')
      setTimeout(() => setAssignMsg(null), 3000)
    } finally {
      setUpdating(false)
    }
  }

  function toggleExpand(qId: string) {
    setExpandedQ((prev) => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3" />
        <div className="h-24 bg-gray-100 rounded-card" />
        <div className="h-48 bg-gray-100 rounded-card" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="p-6 text-center py-24">
        <span className="text-5xl">🔍</span>
        <p className="font-display font-bold text-lg text-gray-700 mt-4 mb-2">Không tìm thấy bài kiểm tra</p>
        <p className="text-sm text-gray-400 mb-6">Bài này không tồn tại hoặc bạn không có quyền xem.</p>
        <Link href="/teacher/quiz" className="text-primary text-sm font-medium hover:underline">← Quay lại danh sách</Link>
      </div>
    )
  }

  if (!quiz) return null

  const diff   = DIFF_CONFIG[quiz.difficulty]   ?? DIFF_CONFIG.medium
  const status = STATUS_CONFIG[quiz.status]     ?? STATUS_CONFIG.draft

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-start gap-3">
          <Link href="/teacher/quiz" className="mt-1 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-xl text-gray-900 truncate">{quiz.title}</h1>
              {quiz.ai_generated && (
                <span className="text-xs bg-accent/8 text-accent px-2 py-0.5 rounded font-medium flex-shrink-0">AI</span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color} flex-shrink-0`}>{status.label}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              <span>{SUBJ_LABEL[quiz.subject] ?? quiz.subject}</span>
              <span>·</span>
              <span>Lớp {quiz.grade}</span>
              <span>·</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>
              <span>·</span>
              <span>{quiz.question_count} câu</span>
              <span>·</span>
              <span>{quiz.time_limit_minutes} phút</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {(statusMsg || assignMsg) && (
              <span className="text-xs text-success font-medium animate-fade-in">{statusMsg ?? assignMsg}</span>
            )}

            {quiz.status === 'draft' && (
              <button onClick={() => updateStatus('published')} disabled={updating}
                className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-1.5">
                {updating ? <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '📢'}
                Đăng bài
              </button>
            )}
            {quiz.status === 'published' && (
              <button onClick={() => updateStatus('archived')} disabled={updating}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-btn hover:bg-gray-50 transition-colors disabled:opacity-60">
                Lưu trữ
              </button>
            )}
            {quiz.status === 'archived' && (
              <button onClick={() => updateStatus('draft')} disabled={updating}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-btn hover:bg-gray-50 transition-colors disabled:opacity-60">
                Khôi phục
              </button>
            )}

            <button onClick={deleteQuiz} disabled={updating}
              className="border border-danger/30 text-danger text-sm font-medium px-4 py-2 rounded-btn hover:bg-danger/5 transition-colors disabled:opacity-60">
              Xoá
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Meta cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Số câu hỏi', value: `${quiz.question_count} câu` },
            { label: 'Thời gian',  value: `${quiz.time_limit_minutes} phút` },
            { label: 'Ngày tạo',   value: new Date(quiz.created_at).toLocaleDateString('vi-VN') },
            { label: 'Đã giao',    value: assignments.length > 0 ? `${assignments.length} lớp` : 'Chưa giao' },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-card shadow-card p-4">
              <p className="text-xs text-gray-400 mb-1">{m.label}</p>
              <p className="font-display font-bold text-gray-900">{m.value}</p>
            </div>
          ))}
        </div>

        {/* ── Assignment section ─────────────────────────────────────────── */}
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-gray-900">Giao bài cho lớp</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {assignments.length > 0
                  ? `Đang giao cho ${assignments.length} lớp · phụ huynh có con trong lớp sẽ thấy bài`
                  : 'Chưa giao cho lớp nào'}
              </p>
            </div>
            {quiz.status !== 'published' && classes.length > 0 && (
              <span className="flex-shrink-0 text-xs text-warning bg-warning/8 px-2.5 py-1 rounded-full font-medium">
                Cần đăng bài trước để học sinh thấy
              </span>
            )}
          </div>

          {assignErr && (
            <div className="px-5 py-3 bg-danger/4 border-b border-danger/10 text-xs text-danger font-medium">
              {assignErr}
            </div>
          )}

          {assignLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-input animate-pulse motion-safe:animate-pulse" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-3xl">🏫</span>
              <p className="text-sm text-gray-500 mt-3 font-medium">Bạn chưa có lớp nào</p>
              <p className="text-xs text-gray-400 mt-1">Liên hệ quản trị viên trường để được thêm vào lớp.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {classes.map((cls) => {
                const assignment = assignments.find((a) => a.class_id === cls.id)
                const isAssigned = !!assignment
                const isPending  = pendingClassId === cls.id

                return (
                  <div key={cls.id}
                    className={`transition-colors ${isAssigned ? 'bg-primary/[0.02]' : ''}`}>
                    <div className="px-5 py-3.5 flex items-center gap-3">
                      {/* Status dot */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        isAssigned ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isAssigned ? '✓' : cls.grade}
                      </div>

                      {/* Class info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {cls.name}
                          <span className="ml-1.5 text-xs text-gray-400 font-normal">Lớp {cls.grade}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {cls.student_count} học sinh
                          {isAssigned && assignment.due_date && (
                            <span className="text-warning ml-2">
                              · Hạn: {new Date(assignment.due_date).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          {isAssigned && !assignment.due_date && (
                            <span className="text-gray-400 ml-2">· Không hạn</span>
                          )}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isAssigned ? (
                          <>
                            <button
                              onClick={() => {
                                setPendingClassId(cls.id)
                                setPendingDueDate(assignment.due_date ? assignment.due_date.slice(0, 10) : '')
                              }}
                              className="text-xs text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-input hover:border-primary/40 hover:text-primary transition-colors">
                              Sửa hạn
                            </button>
                            <button
                              onClick={() => unassignFromClass(cls.id)}
                              disabled={updating}
                              className="text-xs text-danger border border-danger/20 px-2.5 py-1.5 rounded-input hover:bg-danger/5 transition-colors disabled:opacity-50">
                              Bỏ giao
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setPendingClassId(cls.id); setPendingDueDate('') }}
                            className="text-xs text-primary font-semibold border border-primary/30 bg-primary/6 px-3 py-1.5 rounded-input hover:bg-primary/12 transition-colors">
                            + Giao bài
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline date picker when pending */}
                    {isPending && (
                      <div className="px-5 pb-3.5 ml-11 flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-input px-3 py-1.5">
                          <span className="text-xs text-gray-400">Hạn nộp:</span>
                          <input
                            type="date"
                            value={pendingDueDate}
                            onChange={(e) => setPendingDueDate(e.target.value)}
                            className="text-sm text-gray-800 bg-transparent outline-none"
                          />
                        </div>
                        <span className="text-xs text-gray-400">(tuỳ chọn)</span>
                        <button
                          onClick={() => assignToClass(cls.id, pendingDueDate || null)}
                          disabled={updating}
                          className="text-xs bg-primary text-white font-semibold px-3 py-1.5 rounded-input hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-1">
                          {updating
                            ? <span className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : null}
                          Xác nhận
                        </button>
                        <button
                          onClick={() => setPendingClassId(null)}
                          className="text-xs text-gray-500 px-2.5 py-1.5 rounded-input hover:bg-gray-100 transition-colors">
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Questions list ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">
              Danh sách câu hỏi
              <span className="ml-2 text-sm font-normal text-gray-400">({quiz.questions.length} câu)</span>
            </h2>
            {quiz.questions.length > 0 && (
              <button onClick={() => {
                if (expandedQ.size === quiz.questions.length) setExpandedQ(new Set())
                else setExpandedQ(new Set(quiz.questions.map((q) => q.id)))
              }} className="text-xs text-primary hover:underline">
                {expandedQ.size === quiz.questions.length ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
              </button>
            )}
          </div>

          {quiz.questions.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl">📋</span>
              <p className="text-gray-500 text-sm mt-3">Chưa có câu hỏi nào trong bài này.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {quiz.questions.map((q, idx) => {
                const expanded = expandedQ.has(q.id)
                return (
                  <div key={q.id} className="p-5">
                    <button
                      onClick={() => toggleExpand(q.id)}
                      className="w-full flex items-start gap-4 text-left group"
                    >
                      <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/8 text-primary text-sm font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <p className="flex-1 text-sm font-medium text-gray-900 leading-relaxed">
                        {q.question_text}
                      </p>
                      <span className="flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5">
                        {expanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {expanded && (
                      <div className="mt-3 ml-11 space-y-2 animate-fade-in">
                        {q.question_type === 'essay' ? (
                          <div className="px-3 py-2.5 bg-success/6 border border-success/20 rounded-input">
                            <p className="text-xs font-semibold text-success mb-1">✍️ Tự luận — Đáp án mẫu / tiêu chí chấm</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {q.sample_answer || <em className="text-gray-400">Chưa có đáp án mẫu</em>}
                            </p>
                          </div>
                        ) : q.options.map((opt, i) => {
                          const isCorrect = i === q.correct_index
                          return (
                            <div key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-input text-sm ${
                              isCorrect ? 'bg-success/8 border border-success/20' : 'bg-gray-50 border border-transparent'
                            }`}>
                              <span className={`flex-shrink-0 font-bold text-xs ${isCorrect ? 'text-success' : 'text-gray-400'}`}>
                                {OPTS[i]}.
                              </span>
                              <span className={isCorrect ? 'text-success font-medium' : 'text-gray-600'}>{opt}</span>
                              {isCorrect && (
                                <span className="ml-auto flex-shrink-0 text-success text-xs font-semibold">✓ Đúng</span>
                              )}
                            </div>
                          )
                        })}

                        {q.explanation && (
                          <div className="mt-2 px-3 py-2.5 bg-primary/4 border border-primary/10 rounded-input">
                            <p className="text-xs font-semibold text-primary mb-1">Giải thích</p>
                            <p className="text-xs text-gray-700 leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
