'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import Link                                  from 'next/link'
import { getBrowserClient }                  from '../../../../lib/supabase'
import { useUser }                           from '../../../../lib/user-context'

interface Quiz {
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
}

const SUBJECTS: { value: string; label: string }[] = [
  { value: 'math',        label: 'Toán' },
  { value: 'literature',  label: 'Văn' },
  { value: 'english',     label: 'Anh' },
  { value: 'physics',     label: 'Lý' },
  { value: 'chemistry',   label: 'Hóa' },
  { value: 'biology',     label: 'Sinh' },
  { value: 'history',     label: 'Sử' },
  { value: 'geography',   label: 'Địa' },
  { value: 'civics',      label: 'GDCD' },
  { value: 'informatics', label: 'Tin học' },
]
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

const DIFF_CONFIG = {
  easy:   { label: 'Dễ',    color: 'bg-success/10 text-success' },
  medium: { label: 'TB',    color: 'bg-warning/10 text-warning' },
  hard:   { label: 'Khó',   color: 'bg-danger/10 text-danger' },
}
const STATUS_CONFIG = {
  draft:     { label: 'Nháp',       color: 'bg-gray-100 text-gray-500' },
  published: { label: 'Đã đăng',    color: 'bg-primary/10 text-primary' },
  archived:  { label: 'Lưu trữ',   color: 'bg-gray-100 text-gray-400' },
}

const SUBJ_LABEL = Object.fromEntries(SUBJECTS.map((s) => [s.value, s.label]))

// ─── Upload File Modal ───────────────────────────────────────────────────────
function UploadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (q: Quiz) => void }) {
  const [file,       setFile]       = useState<File | null>(null)
  const [title,      setTitle]      = useState('')
  const [subject,    setSubject]    = useState('math')
  const [grade,      setGrade]      = useState(10)
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium')
  const [timeLimit,  setTimeLimit]  = useState(15)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !title) {
      const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      setTitle(name)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Vui lòng chọn file'); return }

    setLoading(true); setError(null)

    const fd = new FormData()
    fd.append('file',             file)
    fd.append('subject',          subject)
    fd.append('grade',            String(grade))
    fd.append('difficulty',       difficulty)
    fd.append('timeLimitMinutes', String(timeLimit))
    if (title.trim()) fd.append('title', title.trim())

    try {
      const res = await fetch('/api/v1/quiz/upload', { method: 'POST', body: fd })

      if (!res.ok) {
        const err        = await res.json().catch(() => ({}))
        const errPayload = (err as { error?: string | { message?: string } }).error
        setError(
          typeof errPayload === 'string'
            ? errPayload
            : (errPayload as { message?: string } | undefined)?.message ?? 'Upload thất bại, thử lại sau.',
        )
        return
      }

      const data = (await res.json()) as { data: Quiz }
      onCreated(data.data)
    } catch {
      setError('Không kết nối được server. Kiểm tra mạng và thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const fileExt = file?.name.toLowerCase().split('.').pop()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-xl">📁</div>
            <div>
              <h2 className="font-display font-bold text-gray-900">Upload từ file</h2>
              <p className="text-xs text-gray-400">Nhập câu hỏi từ Excel hoặc Word</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          {error && (
            <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5">{error}</div>
          )}

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File câu hỏi</label>
            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-card p-6 cursor-pointer transition-colors ${
              file ? 'border-primary/40 bg-primary/4' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="file"
                accept=".xlsx,.xls,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="text-center">
                  <span className="text-3xl">{fileExt === 'docx' ? '📄' : '📊'}</span>
                  <p className="mt-2 text-sm font-medium text-primary">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB — nhấn để đổi file</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-3xl text-gray-300">📂</span>
                  <p className="mt-2 text-sm text-gray-600 font-medium">Chọn file Excel hoặc Word</p>
                  <p className="text-xs text-gray-400 mt-1">Hỗ trợ: .xlsx, .xls, .docx (tối đa 10MB)</p>
                </div>
              )}
            </label>
          </div>

          {/* Format guide */}
          <div className="bg-gray-50 rounded-input px-4 py-3 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700 mb-1.5">Format Excel (các cột):</p>
            <p><span className="font-mono bg-white px-1 rounded border border-gray-200">Câu hỏi</span> · <span className="font-mono bg-white px-1 rounded border border-gray-200">A</span> · <span className="font-mono bg-white px-1 rounded border border-gray-200">B</span> · <span className="font-mono bg-white px-1 rounded border border-gray-200">C</span> · <span className="font-mono bg-white px-1 rounded border border-gray-200">D</span> · <span className="font-mono bg-white px-1 rounded border border-gray-200">Đáp án</span> · <span className="font-mono bg-white px-1 rounded border border-gray-200">Giải thích</span></p>
            <p>Cột Đáp án điền A/B/C/D hoặc 1/2/3/4</p>
            <p className="text-gray-400">Word: AI sẽ tự phân tích câu hỏi từ nội dung file</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề bài kiểm tra</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tự động từ tên file nếu để trống"
              className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Môn học</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-input px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Khối lớp</label>
              <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-input px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                {GRADES.map((g) => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy','medium','hard'] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDifficulty(d)}
                  className={`py-2.5 rounded-input text-sm font-medium border transition-colors ${
                    difficulty === d ? 'border-primary bg-primary/8 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {DIFF_CONFIG[d].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Thời gian làm bài</label>
              <span className="text-sm font-bold text-primary">{timeLimit} phút</span>
            </div>
            <input type="range" min={5} max={90} step={5} value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5ph</span><span>90ph</span></div>
          </div>

          <button type="submit" disabled={loading || !file}
            className="w-full bg-accent text-white font-bold text-sm py-3 rounded-btn hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {fileExt === 'docx' ? 'AI đang phân tích file...' : 'Đang xử lý file...'}
              </>
            ) : (
              <>📁 Tạo bài từ file</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── AI Generate Modal ───────────────────────────────────────────────────────
function GenerateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (q: Quiz) => void }) {
  const [subject,    setSubject]    = useState('math')
  const [grade,      setGrade]      = useState(10)
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium')
  const [count,      setCount]      = useState(10)
  const [timeLimit,  setTimeLimit]  = useState(15)
  const [topic,      setTopic]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)

    try {
      const res = await fetch('/api/v1/quiz', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          subject, grade, difficulty,
          questionCount:    count,
          timeLimitMinutes: timeLimit,
          topic:            topic.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const errPayload = (err as { error?: string | { message?: string } }).error
        setError(
          typeof errPayload === 'string'
            ? errPayload
            : (errPayload as { message?: string } | undefined)?.message ?? 'Tạo bài thất bại, thử lại sau.',
        )
        return
      }

      const quiz = (await res.json()) as { data: Quiz }
      onCreated(quiz.data)
    } catch {
      setError('Không kết nối được server. Kiểm tra mạng và thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white">🤖</div>
            <div>
              <h2 className="font-display font-bold text-gray-900">Tạo bài kiểm tra bằng AI</h2>
              <p className="text-xs text-gray-400">Gemini sẽ tự động soạn câu hỏi cho bạn</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          {error && (
            <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Môn học</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-input px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Khối lớp</label>
              <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-input px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                {GRADES.map((g) => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy','medium','hard'] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDifficulty(d)}
                  className={`py-2.5 rounded-input text-sm font-medium border transition-colors ${
                    difficulty === d ? 'border-primary bg-primary/8 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {DIFF_CONFIG[d].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Chủ đề / Nội dung <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
            </label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="Vd: Phương trình bậc hai, Chiến tranh thế giới II..."
              className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Số câu</label>
                <span className="text-sm font-bold text-primary">{count}</span>
              </div>
              <input type="range" min={5} max={20} step={1} value={count} onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5</span><span>20</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Thời gian</label>
                <span className="text-sm font-bold text-primary">{timeLimit} phút</span>
              </div>
              <input type="range" min={5} max={90} step={5} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5ph</span><span>90ph</span></div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white font-bold text-sm py-3 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                AI đang soạn {count} câu hỏi...
              </>
            ) : (
              <>🤖 Tạo bài kiểm tra</>
            )}
          </button>

          {loading && (
            <p className="text-xs text-center text-gray-400 animate-pulse">
              Quá trình này mất khoảng 10–20 giây, vui lòng không đóng cửa sổ.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeacherQuizPage() {
  const router     = useRouter()
  const { userId } = useUser()

  const [quizzes,      setQuizzes]      = useState<Quiz[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [showUpload,   setShowUpload]   = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')

  const loadQuizzes = useCallback(async () => {
    setLoading(true)
    const sb = getBrowserClient()

    const { data } = await sb
      .from('quizzes')
      .select('id, title, subject, grade, difficulty, status, question_count, time_limit_minutes, ai_generated, due_date, created_at')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false })

    setQuizzes((data ?? []) as Quiz[])
    setLoading(false)
  }, [userId])

  useEffect(() => { loadQuizzes() }, [loadQuizzes])

  function handleCreated(quiz: Quiz) {
    setShowModal(false)
    setQuizzes((prev) => [quiz, ...prev])
    router.push(`/teacher/quiz/${quiz.id}`)
  }

  const filtered = quizzes.filter((q) => {
    if (filterStatus  !== 'all' && q.status  !== filterStatus)  return false
    if (filterSubject !== 'all' && q.subject !== filterSubject) return false
    return true
  })

  const stats = {
    total:     quizzes.length,
    published: quizzes.filter((q) => q.status === 'published').length,
    draft:     quizzes.filter((q) => q.status === 'draft').length,
    ai:        quizzes.filter((q) => q.ai_generated).length,
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Bài kiểm tra</h1>
          <p className="text-sm text-gray-500">Quản lý và tạo bài kiểm tra bằng AI</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowUpload(true)}
            className="border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-btn hover:bg-gray-50 transition-colors flex items-center gap-2">
            📁 Upload file
          </button>
          <button onClick={() => setShowModal(true)}
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors flex items-center gap-2">
            🤖 Tạo bằng AI
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng bài',    value: stats.total,     color: 'text-gray-900' },
            { label: 'Đã đăng',     value: stats.published, color: 'text-primary' },
            { label: 'Nháp',        value: stats.draft,     color: 'text-warning' },
            { label: 'Tạo bởi AI', value: stats.ai,        color: 'text-accent' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-card shadow-card p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`font-display font-extrabold text-2xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="published">Đã đăng</option>
            <option value="archived">Lưu trữ</option>
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
            className="border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Tất cả môn</option>
            {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {(filterStatus !== 'all' || filterSubject !== 'all') && (
            <button onClick={() => { setFilterStatus('all'); setFilterSubject('all') }}
              className="text-xs text-gray-500 hover:text-primary transition-colors">
              × Xóa bộ lọc
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} bài</span>
        </div>

        {/* Quiz table */}
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map((i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <span className="text-5xl">📝</span>
              <p className="font-display font-bold text-gray-700 text-lg mt-4 mb-2">
                {quizzes.length === 0 ? 'Chưa có bài kiểm tra nào' : 'Không có kết quả'}
              </p>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                {quizzes.length === 0
                  ? 'Nhấn "Tạo bằng AI" để Gemini soạn bài kiểm tra cho bạn trong vài giây.'
                  : 'Thử thay đổi bộ lọc.'}
              </p>
              {quizzes.length === 0 && (
                <button onClick={() => setShowModal(true)}
                  className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-btn hover:bg-primary-dark transition-colors">
                  🤖 Tạo bài kiểm tra đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Tiêu đề','Môn','Lớp','Độ khó','Số câu','Thời gian','Trạng thái','Ngày tạo',''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((q) => {
                    const diff   = DIFF_CONFIG[q.difficulty]
                    const status = STATUS_CONFIG[q.status]
                    return (
                      <tr key={q.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 max-w-[180px] truncate">{q.title}</p>
                            {q.ai_generated && (
                              <span className="text-xs bg-accent/8 text-accent px-1.5 py-0.5 rounded font-medium flex-shrink-0">AI</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{SUBJ_LABEL[q.subject] ?? q.subject}</td>
                        <td className="px-4 py-3 text-gray-600">Lớp {q.grade}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{q.question_count} câu</td>
                        <td className="px-4 py-3 text-gray-600">{q.time_limit_minutes} phút</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {new Date(q.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/teacher/quiz/${q.id}`}
                            className="text-xs text-primary font-medium hover:underline whitespace-nowrap">
                            Xem chi tiết →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal  && <GenerateModal onClose={() => setShowModal(false)}  onCreated={handleCreated} />}
      {showUpload && <UploadModal  onClose={() => setShowUpload(false)} onCreated={handleCreated} />}
    </div>
  )
}
