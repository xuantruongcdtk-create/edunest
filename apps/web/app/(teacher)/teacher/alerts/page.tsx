'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import { getBrowserClient }                  from '../../../../lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
interface Alert {
  id:         string
  type:       'score_drop' | 'missed_quiz' | 'burnout_risk' | 'improvement' | 'goal_reached'
  severity:   'info' | 'warning' | 'danger'
  title:      string
  body:       string
  is_read:    boolean
  read_at:    string | null
  child_id:   string | null
  created_at: string
  child?:     { full_name: string; grade: number } | null
}

// ── Config ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  score_drop:   { icon: '📉', label: 'Điểm giảm' },
  missed_quiz:  { icon: '📋', label: 'Bỏ quiz' },
  burnout_risk: { icon: '🔥', label: 'Nguy cơ kiệt sức' },
  improvement:  { icon: '📈', label: 'Tiến bộ' },
  goal_reached: { icon: '🏆', label: 'Đạt mục tiêu' },
}
const SEV_CONFIG: Record<string, { label: string; chip: string; dot: string }> = {
  info:    { label: 'Thông tin', chip: 'bg-primary/10 text-primary',  dot: 'bg-primary' },
  warning: { label: 'Cảnh báo',  chip: 'bg-warning/10 text-warning',  dot: 'bg-warning' },
  danger:  { label: 'Nguy hiểm', chip: 'bg-danger/10 text-danger',    dot: 'bg-danger' },
}

type TabKey = 'all' | 'unread' | 'warning' | 'danger'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'unread',  label: 'Chưa đọc' },
  { key: 'warning', label: 'Cảnh báo' },
  { key: 'danger',  label: 'Nghiêm trọng' },
]

export default function TeacherAlertsPage() {
  const router = useRouter()

  const [alerts,   setAlerts]   = useState<Alert[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<TabKey>('all')
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await sb
      .from('alerts')
      .select('id, type, severity, title, body, is_read, read_at, child_id, created_at, children(full_name, grade)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setAlerts((data ?? []).map((a: Record<string, unknown>) => ({
      ...a,
      child: Array.isArray(a.children) ? (a.children[0] ?? null) : (a.children ?? null),
    })) as Alert[])
    setLoading(false)
  }, [router])

  useEffect(() => { loadAlerts() }, [loadAlerts])

  async function markRead(alertId: string) {
    setUpdating((prev) => new Set(prev).add(alertId))
    const sb = getBrowserClient()
    await sb.from('alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', alertId)
    setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, is_read: true } : a))
    setUpdating((prev) => { const s = new Set(prev); s.delete(alertId); return s })
  }

  async function markAllRead() {
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id)
    if (unreadIds.length === 0) return

    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    await sb.from('alerts').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_read', false)
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
  }

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = alerts.filter((a) => {
    if (tab === 'unread')  return !a.is_read
    if (tab === 'warning') return a.severity === 'warning'
    if (tab === 'danger')  return a.severity === 'danger'
    return true
  })

  const counts = {
    all:     alerts.length,
    unread:  alerts.filter((a) => !a.is_read).length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    danger:  alerts.filter((a) => a.severity === 'danger').length,
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-bold text-xl text-gray-900">Cảnh báo học sinh</h1>
            <p className="text-sm text-gray-500">Phát hiện sớm học sinh cần hỗ trợ</p>
          </div>
          {counts.unread > 0 && (
            <button onClick={markAllRead}
              className="text-sm text-primary font-medium hover:underline">
              Đánh dấu tất cả đã đọc ({counts.unread})
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Tổng',        value: counts.all,     color: 'text-gray-900' },
            { label: 'Chưa đọc',   value: counts.unread,  color: counts.unread > 0  ? 'text-primary font-extrabold' : 'text-gray-400' },
            { label: 'Cảnh báo',   value: counts.warning, color: counts.warning > 0 ? 'text-warning' : 'text-gray-400' },
            { label: 'Nguy hiểm',  value: counts.danger,  color: counts.danger > 0  ? 'text-danger'  : 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-input p-2.5 text-center">
              <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-btn text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.key ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'
                }`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl">{tab === 'all' ? '✅' : '🔍'}</span>
            <p className="font-display font-bold text-gray-700 text-lg mt-4 mb-2">
              {tab === 'all' ? 'Không có cảnh báo nào' : 'Không có kết quả'}
            </p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {tab === 'all'
                ? 'Khi AI phát hiện học sinh có dấu hiệu cần hỗ trợ, thông báo sẽ xuất hiện ở đây.'
                : 'Thử chuyển tab khác.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((alert) => {
              const typeConf = TYPE_CONFIG[alert.type] ?? { icon: '🔔', label: alert.type }
              const sevConf  = SEV_CONFIG[alert.severity]
              const isUpd    = updating.has(alert.id)

              return (
                <div key={alert.id}
                  className={`bg-white rounded-card border transition-shadow ${
                    alert.is_read ? 'border-gray-100 shadow-none' : 'border-gray-200 shadow-card'
                  }`}>
                  <div className="p-4 flex gap-4">
                    {/* Unread dot + icon */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-0.5">
                      <div className={`h-2 w-2 rounded-full ${alert.is_read ? 'bg-transparent' : sevConf.dot}`} />
                      <span className="text-2xl">{typeConf.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm text-gray-900 ${!alert.is_read ? 'font-semibold' : 'font-medium'}`}>
                              {alert.title}
                            </p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sevConf.chip}`}>
                              {typeConf.label}
                            </span>
                          </div>
                          {alert.child && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Học sinh: <span className="text-gray-600 font-medium">{alert.child.full_name}</span> · Lớp {alert.child.grade}
                            </p>
                          )}
                        </div>
                        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${sevConf.chip}`}>
                          {sevConf.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{alert.body}</p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-300">
                          {new Date(alert.created_at).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </span>
                        {!alert.is_read && (
                          <button
                            onClick={() => markRead(alert.id)}
                            disabled={isUpd}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-60">
                            {isUpd && <span className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                            Đánh dấu đã đọc
                          </button>
                        )}
                        {alert.is_read && (
                          <span className="text-xs text-gray-300 flex items-center gap-1">
                            ✓ Đã đọc {alert.read_at ? new Date(alert.read_at).toLocaleDateString('vi-VN') : ''}
                          </span>
                        )}
                      </div>
                    </div>
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
