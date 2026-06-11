'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrowserClient } from '../../../../../lib/supabase'
import { useUser } from '../../../../../lib/user-context'

interface Child {
  id: string
  full_name: string
  grade: number
}

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_index: number
  explanation: string | null
  order_index: number
}

interface QuizDetail {
  id: string
  title: string
  subject: string
  grade: number
  difficulty: 'easy' | 'medium' | 'hard'
  question_count: number
  time_limit_minutes: number
  due_date: string | null
  questions: Question[]
}

interface AttemptResult {
  score: number
  max_score: number
  time_taken_seconds: number
}

type PageState = 'loading' | 'intro' | 'taking' | 'results' | 'notfound'

const SUBJ_LABEL: Record<string, string> = {
  math: 'Toán', literature: 'Văn', english: 'Anh', physics: 'Lý',
  chemistry: 'Hóa', biology: 'Sinh', history: 'Sử', geography: 'Địa',
  civics: 'GDCD', informatics: 'Tin học',
}
const OPTS = ['A', 'B', 'C', 'D']

export default function ParentQuizAttemptPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { userId } = useUser()
  const router = useRouter()

  const [pageState,     setPageState]     = useState<PageState>('loading')
  const [quiz,          setQuiz]          = useState<QuizDetail | null>(null)
  const [children,      setChildren]      = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [currentQ,      setCurrentQ]      = useState(0)
  const [answers,       setAnswers]       = useState<(number | null)[]>([])
  const [timeLeft,      setTimeLeft]      = useState(0)
  const [startTime,     setStartTime]     = useState(0)
  const [result,        setResult]        = useState<AttemptResult | null>(null)
  const [submitting,    setSubmitting]    = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function load() {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: quizData, error: qe }, { data: childData }] = await Promise.all([
        sb.from('quizzes')
          .select('id, title, subject, grade, difficulty, question_count, time_limit_minutes, due_date')
          .eq('id', id)
          .eq('status', 'published')
          .single(),
        sb.from('children').select('id, full_name, grade').eq('parent_id', user.id),
      ])

      if (qe || !quizData) { setPageState('notfound'); return }

      const { data: questions } = await sb
        .from('quiz_questions')
        .select('id, question_text, options, correct_index, explanation, order_index')
        .eq('quiz_id', id)
        .order('order_index', { ascending: true })

      const kids = (childData ?? []) as Child[]
      setChildren(kids)
      if (kids.length === 1) setSelectedChild(kids[0].id)

      setQuiz({
        ...(quizData as Omit<QuizDetail, 'questions'>),
        questions: (questions ?? []) as Question[],
      })
      setPageState('intro')
    }
    load()
  }, [id, router])

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitting(true)

    const timeTaken     = Math.round((Date.now() - startTime) / 1000)
    const finalAnswers  = answers.map((a) => a ?? 0)

    try {
      const res = await fetch('/api/v1/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId:           quiz.id,
          childId:          selectedChild || undefined,
          answers:          finalAnswers,
          timeTakenSeconds: timeTaken,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setResult({ score: data.data.score, max_score: data.data.max_score, time_taken_seconds: timeTaken })
      } else {
        const score = finalAnswers.reduce((sum, ans, i) =>
          sum + (ans === quiz.questions[i].correct_index ? 1 : 0), 0)
        setResult({ score, max_score: quiz.questions.length, time_taken_seconds: timeTaken })
      }
    } catch {
      const score = finalAnswers.reduce((sum, ans, i) =>
        sum + (ans === quiz.questions[i].correct_index ? 1 : 0), 0)
      setResult({ score, max_score: quiz.questions.length, time_taken_seconds: timeTaken })
    }

    setPageState('results')
    setSubmitting(false)
  }, [quiz, submitting, startTime, answers, selectedChild])

  useEffect(() => {
    if (pageState !== 'taking') return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [pageState, handleSubmit])

  function startQuiz() {
    if (!quiz) return
    setAnswers(new Array(quiz.questions.length).fill(null))
    setCurrentQ(0)
    setTimeLeft(quiz.time_limit_minutes * 60)
    setStartTime(Date.now())
    setPageState('taking')
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="p-6 space-y-4 animate-pulse motion-safe:animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-48 bg-gray-100 rounded-card" />
      </div>
    )
  }

  if (pageState === 'notfound' || !quiz) {
    return (
      <div className="p-6 text-center py-24">
        <span className="text-5xl">🔍</span>
        <p className="font-display font-bold text-lg text-gray-700 mt-4 mb-2">Không tìm thấy bài kiểm tra</p>
        <p className="text-sm text-gray-400 mb-6">Bài này không tồn tại hoặc chưa được đăng.</p>
        <Link href="/parent/quiz" className="text-primary text-sm font-medium hover:underline">← Quay lại</Link>
      </div>
    )
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (pageState === 'intro') {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <Link href="/parent/quiz" className="text-gray-400 hover:text-gray-700 transition-colors">←</Link>
          <h1 className="font-display font-bold text-xl text-gray-900 truncate">{quiz.title}</h1>
        </div>

        <div className="p-6 max-w-lg mx-auto w-full space-y-5">
          {/* Quiz info */}
          <div className="bg-white rounded-card shadow-card p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Môn học',     value: SUBJ_LABEL[quiz.subject] ?? quiz.subject },
                { label: 'Khối lớp',   value: `Lớp ${quiz.grade}` },
                { label: 'Số câu hỏi', value: `${quiz.question_count} câu` },
                { label: 'Thời gian',  value: `${quiz.time_limit_minutes} phút` },
              ].map((m) => (
                <div key={m.label} className="bg-gray-50 rounded-input p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
                  <p className="font-semibold text-gray-900 text-sm">{m.value}</p>
                </div>
              ))}
            </div>
            {quiz.due_date && (
              <div className="flex items-center gap-2 text-sm text-warning bg-warning/8 rounded-input px-3 py-2 mt-3">
                <span>⏰</span>
                <span>Hạn nộp: {new Date(quiz.due_date).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>

          {/* Select child */}
          {children.length > 0 && (
            <div className="bg-white rounded-card shadow-card p-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Chọn con làm bài</p>
              <div className="space-y-2">
                {children.map((child) => (
                  <button key={child.id}
                    onClick={() => setSelectedChild(child.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-input border transition-colors ${
                      selectedChild === child.id
                        ? 'border-primary bg-primary/8'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">{child.full_name.charAt(0)}</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-medium ${selectedChild === child.id ? 'text-primary' : 'text-gray-900'}`}>
                        {child.full_name}
                      </p>
                      <p className="text-xs text-gray-400">Lớp {child.grade}</p>
                    </div>
                    {selectedChild === child.id && <span className="text-primary text-sm">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {children.length === 0 && (
            <div className="bg-warning/8 border border-warning/20 rounded-card p-4 text-sm text-warning">
              Bạn chưa thêm hồ sơ con.{' '}
              <Link href="/parent/children" className="font-semibold underline">Thêm hồ sơ →</Link>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-primary/4 border border-primary/10 rounded-card p-4 text-sm text-gray-700 space-y-1">
            <p className="font-semibold text-primary mb-2">Hướng dẫn</p>
            <p>• Có {quiz.question_count} câu hỏi, thời gian {quiz.time_limit_minutes} phút</p>
            <p>• Chọn một đáp án cho mỗi câu</p>
            <p>• Bài tự nộp khi hết giờ</p>
          </div>

          <button
            onClick={startQuiz}
            disabled={children.length > 0 && !selectedChild}
            className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            🚀 Bắt đầu làm bài
          </button>
        </div>
      </div>
    )
  }

  // ── Taking ────────────────────────────────────────────────────────────────
  if (pageState === 'taking') {
    const q           = quiz.questions[currentQ]
    const answered    = answers.filter((a) => a !== null).length
    const progress    = ((currentQ + 1) / quiz.questions.length) * 100
    const isUrgent    = timeLeft < 60
    const isLastQ     = currentQ === quiz.questions.length - 1

    return (
      <div className="flex flex-col min-h-full">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Câu {currentQ + 1} / {quiz.questions.length}
            </span>
            <div className={`flex items-center gap-1.5 text-sm font-bold motion-safe:transition-colors ${
              isUrgent ? 'text-danger animate-pulse' : 'text-gray-700'
            }`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-6 max-w-lg mx-auto w-full flex-1 flex flex-col">
          {/* Question card */}
          <div className="bg-white rounded-card shadow-card p-5 flex-1 mb-5">
            <div className="flex items-start gap-3 mb-5">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                {currentQ + 1}
              </span>
              <p className="text-gray-900 font-medium leading-relaxed">{q.question_text}</p>
            </div>

            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                const selected = answers[currentQ] === i
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((prev) => { const n = [...prev]; n[currentQ] = i; return n })}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-input border text-left transition-all focus-visible:ring-2 focus-visible:ring-primary/50 ${
                      selected
                        ? 'border-primary bg-primary/8 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 transition-colors ${
                      selected ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-500'
                    }`}>
                      {OPTS[i]}
                    </span>
                    <span className={`text-sm leading-relaxed ${selected ? 'text-primary font-medium' : 'text-gray-700'}`}>
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentQ((p) => p - 1)}
              disabled={currentQ === 0}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-btn hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              ← Câu trước
            </button>

            {!isLastQ ? (
              <button
                onClick={() => setCurrentQ((p) => p + 1)}
                className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-btn hover:bg-primary-dark transition-colors"
              >
                Câu sau →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-success text-white text-sm font-bold py-2.5 rounded-btn transition-colors disabled:opacity-60"
              >
                {submitting ? '⌛ Đang nộp...' : `Nộp bài (${answered}/${quiz.questions.length})`}
              </button>
            )}
          </div>

          {/* Dot nav */}
          <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                aria-label={`Câu ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === currentQ        ? 'bg-primary w-5' :
                  answers[i] !== null   ? 'bg-primary/40 w-2.5' :
                  'bg-gray-200 w-2.5'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (pageState === 'results' && result) {
    const pct          = Math.round((result.score / result.max_score) * 100)
    const passed       = pct >= 50
    const finalAnswers = answers.map((a) => a ?? 0)

    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
          <h1 className="font-display font-bold text-xl text-gray-900">Kết quả</h1>
        </div>

        <div className="p-6 max-w-lg mx-auto w-full space-y-5">
          {/* Score */}
          <div className={`rounded-card p-6 text-center border ${
            passed ? 'bg-success/8 border-success/20' : 'bg-danger/8 border-danger/20'
          }`}>
            <div className={`text-6xl font-display font-extrabold mb-2 ${passed ? 'text-success' : 'text-danger'}`}>
              {pct}%
            </div>
            <p className="font-display font-bold text-gray-900 text-lg mb-1">{quiz.title}</p>
            <p className={`text-sm font-medium mb-4 ${passed ? 'text-success' : 'text-danger'}`}>
              {passed ? '🎉 Đạt yêu cầu!' : '📚 Cần ôn tập thêm'}
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-600">
              <span>Đúng: <strong className="text-success">{result.score}</strong>/{result.max_score}</span>
              <span>·</span>
              <span>Thời gian: <strong>{formatTime(result.time_taken_seconds)}</strong></span>
            </div>
          </div>

          {/* Answer review */}
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-display font-semibold text-gray-900">Chi tiết từng câu</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {quiz.questions.map((q, idx) => {
                const userAns = finalAnswers[idx]
                const isRight = userAns === q.correct_index
                return (
                  <div key={q.id} className="p-4">
                    <div className="flex items-start gap-2.5 mb-3">
                      <span className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isRight ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                        {isRight ? '✓' : '✗'}
                      </span>
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question_text}</p>
                    </div>
                    <div className="ml-7.5 space-y-1.5">
                      {q.options.map((opt, i) => {
                        const isCorrect = i === q.correct_index
                        const isUser    = i === userAns
                        return (
                          <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-input text-xs ${
                            isCorrect              ? 'bg-success/8 border border-success/20 text-success font-medium' :
                            isUser && !isRight     ? 'bg-danger/8 border border-danger/20 text-danger' :
                            'text-gray-500'
                          }`}>
                            <span className="font-bold w-4">{OPTS[i]}.</span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && <span className="text-success font-semibold ml-auto">✓ Đúng</span>}
                            {isUser && !isRight && <span className="text-danger ml-auto">Đã chọn</span>}
                          </div>
                        )
                      })}
                      {q.explanation && (
                        <div className="mt-1 px-3 py-2 bg-primary/4 border border-primary/10 rounded-input text-xs text-gray-700">
                          <span className="font-semibold text-primary">Giải thích: </span>{q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setPageState('intro'); setResult(null) }}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-btn hover:bg-gray-50 transition-colors"
            >
              Làm lại
            </button>
            <Link
              href="/parent/quiz"
              className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-btn hover:bg-primary-dark transition-colors text-center"
            >
              Xem bài khác
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
