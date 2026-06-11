'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '../../../../lib/supabase'
import { useUser } from '../../../../lib/user-context'
import Link from 'next/link'

interface Child {
  id: string
  full_name: string
  grade: number
}

interface Quiz {
  id: string
  title: string
  subject: string
  grade: number
  difficulty: 'easy' | 'medium' | 'hard'
  question_count: number
  time_limit_minutes: number
  created_at: string
  // Từ quiz_assignments — hạn nộp và tên lớp theo assignment cụ thể
  assignment_due_date: string | null
  class_name: string | null
}

interface Attempt {
  quiz_id: string
  score: number
  max_score: number
  student_id: string
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

const ALL_SUBJECTS = ['math','literature','english','physics','chemistry','biology','history','geography','civics','informatics']

export default function ParentQuizPage() {
  const { userId } = useUser()
  const [quizzes,  setQuizzes]  = useState<Quiz[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    async function load() {
      const sb = getBrowserClient()

      // Fetch qua quiz_assignments để lấy tên lớp + due_date theo assignment.
      // RLS tự lọc: chỉ trả về assignment của lớp có con phụ huynh này.
      const [{ data: assignData }, { data: childData }] = await Promise.all([
        sb.from('quiz_assignments')
          .select(`
            due_date,
            class:classes!class_id ( name ),
            quiz:quizzes!quiz_id (
              id, title, subject, grade, difficulty,
              question_count, time_limit_minutes, created_at
            )
          `)
          .order('created_at', { ascending: false }),
        sb.from('children')
          .select('id, full_name, grade')
          .eq('parent_id', userId),
      ])

      const kids = (childData ?? []) as Child[]
      setChildren(kids)

      // Dedup: nếu cùng quiz_id giao nhiều lớp → giữ hạn nộp gần nhất
      const seen = new Map<string, Quiz>()
      for (const row of (assignData ?? []) as any[]) {
        if (!row.quiz) continue
        const q = row.quiz as Omit<Quiz, 'assignment_due_date' | 'class_name'>
        const existing = seen.get(q.id)
        const newDue   = row.due_date as string | null
        // Ưu tiên due_date gần nhất (nhỏ hơn)
        if (!existing || (newDue && (!existing.assignment_due_date || newDue < existing.assignment_due_date))) {
          seen.set(q.id, {
            ...q,
            assignment_due_date: newDue,
            class_name:          (row.class as { name?: string } | null)?.name ?? null,
          })
        }
      }
      setQuizzes(Array.from(seen.values()))

      if (kids.length > 0) {
        const { data: attData } = await sb
          .from('quiz_attempts')
          .select('quiz_id, score, max_score, student_id')
          .in('student_id', kids.map((c) => c.id))
        setAttempts((attData ?? []) as Attempt[])
      }

      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const filtered = filter === 'all' ? quizzes : quizzes.filter((q) => q.subject === filter)

  function getBestScore(quizId: string): number | null {
    const rel = attempts.filter((a) => a.quiz_id === quizId)
    if (!rel.length) return null
    return Math.max(...rel.map((a) => Math.round((a.score / a.max_score) * 100)))
  }

  const completedCount = new Set(attempts.map((a) => a.quiz_id)).size

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="font-display font-bold text-xl text-gray-900">Bài kiểm tra</h1>
        <p className="text-sm text-gray-500">Xem và cho con làm các bài kiểm tra từ giáo viên</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Bài có sẵn',    value: quizzes.length,  color: 'text-gray-900' },
            { label: 'Đã hoàn thành', value: completedCount,  color: 'text-primary'  },
            { label: 'Số con',        value: children.length, color: 'text-accent'   },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-card shadow-card p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`font-display font-extrabold text-2xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Subject filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            Tất cả
          </button>
          {ALL_SUBJECTS.filter((s) => quizzes.some((q) => q.subject === s)).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {SUBJ_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Quiz list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-card animate-pulse motion-safe:animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-card shadow-card">
            <span className="text-5xl">📝</span>
            <p className="font-display font-bold text-gray-700 text-lg mt-4 mb-2">
              {quizzes.length === 0 ? 'Chưa có bài kiểm tra nào' : 'Không có bài nào'}
            </p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {quizzes.length === 0
                ? 'Giáo viên chưa giao bài kiểm tra cho lớp của con bạn.'
                : 'Thử chọn môn học khác.'}
            </p>
            {quizzes.length === 0 && children.length === 0 && (
              <p className="text-xs text-warning mt-2">
                Bạn chưa thêm hồ sơ con →{' '}
                <a href="/parent/children" className="underline font-medium">Thêm ngay</a>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((quiz) => {
              const diff      = DIFF_CONFIG[quiz.difficulty] ?? DIFF_CONFIG.medium
              const bestScore = getBestScore(quiz.id)
              const isDue     = quiz.assignment_due_date && new Date(quiz.assignment_due_date) < new Date()

              return (
                <div key={quiz.id} className="bg-white rounded-card shadow-card p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-display font-semibold text-gray-900 truncate">{quiz.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${diff.color}`}>
                        {diff.label}
                      </span>
                      {isDue && quiz.assignment_due_date && (
                        <span className="text-xs font-medium text-danger bg-danger/8 px-2 py-0.5 rounded-full flex-shrink-0">
                          Hết hạn
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                      <span>{SUBJ_LABEL[quiz.subject] ?? quiz.subject}</span>
                      <span>·</span>
                      <span>Lớp {quiz.grade}</span>
                      {quiz.class_name && (
                        <>
                          <span>·</span>
                          <span className="text-accent font-medium">{quiz.class_name}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{quiz.question_count} câu</span>
                      <span>·</span>
                      <span>{quiz.time_limit_minutes} phút</span>
                      {quiz.assignment_due_date && !isDue && (
                        <>
                          <span>·</span>
                          <span className="text-warning">
                            Hạn: {new Date(quiz.assignment_due_date).toLocaleDateString('vi-VN')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {bestScore !== null && (
                      <div className="text-right">
                        <p className={`text-sm font-bold ${bestScore >= 80 ? 'text-success' : bestScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                          {bestScore}%
                        </p>
                        <p className="text-xs text-gray-400">Cao nhất</p>
                      </div>
                    )}
                    <Link
                      href={`/parent/quiz/${quiz.id}`}
                      className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors whitespace-nowrap"
                    >
                      {bestScore !== null ? 'Làm lại' : 'Làm bài →'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
