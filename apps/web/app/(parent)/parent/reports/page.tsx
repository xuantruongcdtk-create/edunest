'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import Link                                  from 'next/link'
import { getBrowserClient }                  from '../../../../lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
interface Child {
  id:        string
  full_name: string
  grade:     number
}
interface SubjectScore {
  subject: string
  avg:     number
}
interface WeeklySummary {
  id:                   string
  week_start:           string
  subject_scores:       SubjectScore[]
  quiz_completion_rate: number
  study_time_minutes:   number
  ai_insight:           string | null
}
interface ScoreRecord {
  child_id:    string
  subject:     string
  score:       number
  max_score:   number
  exam_date:   string
  period_type: string
}
interface Alert {
  id:         string
  type:       string
  severity:   'info' | 'warning' | 'danger'
  title:      string
  body:       string
  is_read:    boolean
  child_id:   string | null
  created_at: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const SUBJ: Record<string, string> = {
  math:'Toán', literature:'Văn', english:'Anh', physics:'Lý',
  chemistry:'Hóa', biology:'Sinh', history:'Sử', geography:'Địa',
  civics:'GDCD', informatics:'Tin học',
}
const ALERT_ICONS: Record<string, string> = {
  score_drop:'📉', missed_quiz:'📋', burnout_risk:'🔥', improvement:'📈', goal_reached:'🏆',
}
const SEVERITY_BG: Record<string, string> = {
  info:'bg-primary/8 border-primary/20 text-primary',
  warning:'bg-warning/8 border-warning/20 text-warning',
  danger:'bg-danger/8 border-danger/20 text-danger',
}

function scoreColor(n: number) {
  if (n >= 8) return 'text-success'
  if (n >= 6.5) return 'text-primary'
  if (n >= 5) return 'text-warning'
  return 'text-danger'
}

function weekLabel(dateStr: string) {
  const d = new Date(dateStr)
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  return `${d.getDate()}/${d.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1}/${end.getFullYear()}`
}

// ── Score breakdown by subject ─────────────────────────────────────────────
function SubjectBreakdown({ scores }: { scores: ScoreRecord[] }) {
  const bySubject: Record<string, { sum: number; count: number }> = {}
  for (const s of scores) {
    const norm = (s.score / s.max_score) * 10
    if (!bySubject[s.subject]) bySubject[s.subject] = { sum: 0, count: 0 }
    bySubject[s.subject].sum   += norm
    bySubject[s.subject].count += 1
  }

  const rows = Object.entries(bySubject)
    .map(([subj, { sum, count }]) => ({ subj, avg: sum / count, count }))
    .sort((a, b) => b.avg - a.avg)

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card p-6 text-center py-12">
        <span className="text-4xl">📊</span>
        <p className="text-gray-500 text-sm mt-3">Chưa có dữ liệu điểm. Nhập điểm tại <Link href="/parent/scores" className="text-primary hover:underline">Bảng điểm</Link>.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-display font-semibold text-gray-900">Điểm trung bình theo môn</h3>
      </div>
      <div className="p-5 space-y-3">
        {rows.map(({ subj, avg, count }) => (
          <div key={subj}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{SUBJ[subj] ?? subj}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{count} lần</span>
                <span className={`font-bold text-sm tabular-nums ${scoreColor(avg)}`}>{avg.toFixed(1)}</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${avg >= 8 ? 'bg-success' : avg >= 6.5 ? 'bg-primary' : avg >= 5 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${(avg / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Weekly card ────────────────────────────────────────────────────────────
function WeeklyCard({ summary, isLatest }: { summary: WeeklySummary; isLatest: boolean }) {
  const [open, setOpen] = useState(isLatest)

  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
        <div className="flex items-center gap-3">
          {isLatest && <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Gần nhất</span>}
          <span className="text-sm font-semibold text-gray-900">Tuần {weekLabel(summary.week_start)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{summary.quiz_completion_rate.toFixed(0)}% quiz</span>
          <span className="text-gray-300 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4 animate-fade-in">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Hoàn thành quiz', value: `${summary.quiz_completion_rate.toFixed(0)}%`, color: summary.quiz_completion_rate >= 80 ? 'text-success' : 'text-warning' },
              { label: 'Thời gian học',   value: `${summary.study_time_minutes} ph`,            color: 'text-primary' },
              { label: 'Môn đã ghi nhận', value: `${summary.subject_scores.length} môn`,        color: 'text-gray-900' },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-input p-3 text-center">
                <p className={`font-bold text-lg ${m.color}`}>{m.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Subject scores */}
          {summary.subject_scores.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Điểm theo môn</p>
              <div className="flex flex-wrap gap-2">
                {summary.subject_scores.map((ss) => (
                  <div key={ss.subject} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <span className="text-xs text-gray-600">{SUBJ[ss.subject] ?? ss.subject}</span>
                    <span className={`text-xs font-bold ${scoreColor(ss.avg)}`}>{ss.avg.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI insight */}
          {summary.ai_insight && (
            <div className="bg-primary/4 border border-primary/10 rounded-input p-3.5 flex gap-3">
              <span className="text-lg flex-shrink-0">🤖</span>
              <p className="text-sm text-gray-700 leading-relaxed">{summary.ai_insight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ParentReportsPage() {
  const router = useRouter()

  const [children,      setChildren]      = useState<Child[]>([])
  const [activeId,      setActiveId]      = useState<string | null>(null)
  const [summaries,     setSummaries]     = useState<WeeklySummary[]>([])
  const [scores,        setScores]        = useState<ScoreRecord[]>([])
  const [alerts,        setAlerts]        = useState<Alert[]>([])
  const [loading,       setLoading]       = useState(true)
  const [childLoading,  setChildLoading]  = useState(false)

  // Load children on mount
  useEffect(() => {
    async function load() {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await sb
        .from('children')
        .select('id, full_name, grade')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true })

      const kids = (data ?? []) as Child[]
      setChildren(kids)
      if (kids.length > 0) setActiveId(kids[0]!.id)
      setLoading(false)
    }
    load()
  }, [router])

  // Load data whenever active child changes
  const loadChildData = useCallback(async (childId: string) => {
    setChildLoading(true)
    const sb = getBrowserClient()

    const [summaryRes, scoresRes, alertsRes] = await Promise.all([
      sb.from('weekly_summaries')
        .select('id, week_start, subject_scores, quiz_completion_rate, study_time_minutes, ai_insight')
        .eq('child_id', childId)
        .order('week_start', { ascending: false })
        .limit(8),

      sb.from('score_records')
        .select('child_id, subject, score, max_score, exam_date, period_type')
        .eq('child_id', childId)
        .order('exam_date', { ascending: false })
        .limit(100),

      sb.from('alerts')
        .select('id, type, severity, title, body, is_read, child_id, created_at')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    setSummaries((summaryRes.data ?? []) as WeeklySummary[])
    setScores((scoresRes.data ?? []) as ScoreRecord[])
    setAlerts((alertsRes.data ?? []) as Alert[])
    setChildLoading(false)
  }, [])

  useEffect(() => {
    if (activeId) loadChildData(activeId)
  }, [activeId, loadChildData])

  async function markAlertRead(alertId: string) {
    const sb = getBrowserClient()
    await sb.from('alerts').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', alertId)
    setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, is_read: true } : a))
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/4" />
        <div className="flex gap-2">{[1,2,3].map((i) => <div key={i} className="h-9 w-24 bg-gray-100 rounded-btn" />)}</div>
        <div className="h-32 bg-gray-100 rounded-card" />
        <div className="h-48 bg-gray-100 rounded-card" />
      </div>
    )
  }

  // ── No children ──────────────────────────────────────────────────────────
  if (children.length === 0) {
    return (
      <div className="p-6 text-center py-20">
        <span className="text-5xl">👦</span>
        <p className="font-display font-bold text-gray-700 text-lg mt-4 mb-2">Chưa có hồ sơ con</p>
        <p className="text-sm text-gray-400 mb-6">Thêm hồ sơ con để xem báo cáo học tập.</p>
        <Link href="/parent/children" className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-btn hover:bg-primary-dark transition-colors">
          Thêm hồ sơ con →
        </Link>
      </div>
    )
  }

  const activeChild = children.find((c) => c.id === activeId)
  const unreadAlerts = alerts.filter((a) => !a.is_read)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display font-bold text-xl text-gray-900">Báo cáo học tập</h1>
            <p className="text-sm text-gray-500">Tổng hợp tuần & phân tích AI theo từng con</p>
          </div>
          {unreadAlerts.length > 0 && (
            <span className="text-xs bg-danger/10 text-danger font-bold px-2.5 py-1 rounded-full">
              {unreadAlerts.length} cảnh báo mới
            </span>
          )}
        </div>
        {/* Child switcher */}
        <div className="flex gap-2 flex-wrap">
          {children.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`px-3.5 py-1.5 rounded-btn text-sm font-medium transition-colors ${
                activeId === c.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {c.full_name} · Lớp {c.grade}
            </button>
          ))}
        </div>
      </div>

      <div className={`p-6 space-y-5 ${childLoading ? 'opacity-60 pointer-events-none' : ''}`}>
        {childLoading && (
          <div className="space-y-3 animate-pulse">
            {[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-card" />)}
          </div>
        )}

        {!childLoading && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Lần nhập điểm', value: scores.length,          color: 'text-gray-900' },
                { label: 'Điểm TB',       value: scores.length > 0
                    ? ((scores.reduce((s, r) => s + (r.score / r.max_score) * 10, 0) / scores.length)).toFixed(1)
                    : '—',                                                  color: 'text-primary' },
                { label: 'Tuần báo cáo', value: summaries.length,        color: 'text-accent' },
                { label: 'Cảnh báo mới', value: unreadAlerts.length,     color: unreadAlerts.length > 0 ? 'text-danger' : 'text-success' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-card shadow-card p-4">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className={`font-display font-extrabold text-2xl ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Weekly summaries */}
            {summaries.length > 0 ? (
              <div className="space-y-3">
                <h2 className="font-display font-semibold text-gray-900">Báo cáo tuần</h2>
                {summaries.map((ws, i) => (
                  <WeeklyCard key={ws.id} summary={ws} isLatest={i === 0} />
                ))}
              </div>
            ) : (
              <div className="bg-primary/4 border border-primary/10 rounded-card p-5 flex gap-3">
                <span className="text-2xl flex-shrink-0">ℹ</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Báo cáo tuần chưa được tạo</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    AI tự động tổng hợp mỗi thứ Hai. Bạn cần nhập đủ điểm trong tuần để tạo báo cáo.
                    Xem điểm tại <Link href="/parent/scores" className="text-primary hover:underline">Bảng điểm</Link>.
                  </p>
                </div>
              </div>
            )}

            {/* Subject breakdown from raw scores */}
            <div>
              <h2 className="font-display font-semibold text-gray-900 mb-3">
                Điểm theo môn — {activeChild?.full_name}
              </h2>
              <SubjectBreakdown scores={scores} />
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-gray-900">Cảnh báo học tập</h2>
                  {unreadAlerts.length > 0 && (
                    <button
                      onClick={async () => {
                        const sb = getBrowserClient()
                        await sb.from('alerts').update({ is_read: true }).eq('child_id', activeId!).eq('is_read', false)
                        setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
                      }}
                      className="text-xs text-primary hover:underline">
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  {alerts.map((alert) => (
                    <div key={alert.id}
                      className={`flex gap-3 p-4 rounded-card border text-sm ${alert.is_read ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-card'}`}>
                      <span className="text-xl flex-shrink-0 mt-0.5">{ALERT_ICONS[alert.type] ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-gray-900 ${!alert.is_read ? 'font-semibold' : ''}`}>{alert.title}</p>
                          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_BG[alert.severity]}`}>
                            {alert.severity === 'danger' ? 'Nguy hiểm' : alert.severity === 'warning' ? 'Cảnh báo' : 'Thông tin'}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{alert.body}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-300">{new Date(alert.created_at).toLocaleDateString('vi-VN')}</span>
                          {!alert.is_read && (
                            <button onClick={() => markAlertRead(alert.id)}
                              className="text-xs text-primary hover:underline">Đánh dấu đã đọc</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
