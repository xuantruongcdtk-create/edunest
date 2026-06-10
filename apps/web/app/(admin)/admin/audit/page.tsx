'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrowserClient }                  from '../../../../lib/supabase'

interface AuditLog {
  id:            string
  actor_id:      string | null
  action:        string
  resource_type: string
  resource_id:   string | null
  old_data:      Record<string, unknown> | null
  new_data:      Record<string, unknown> | null
  ip_address:    string | null
  created_at:    string
  actor?:        { full_name: string; email: string } | null
}

const ACTION_COLORS: Record<string, string> = {
  'flag.update':   'bg-warning/10 text-warning',
  'user.ban':      'bg-danger/10 text-danger',
  'user.unban':    'bg-success/10 text-success',
  'plan.change':   'bg-accent/10 text-accent',
  'quiz.delete':   'bg-danger/10 text-danger',
  'score.delete':  'bg-danger/10 text-danger',
}
const ACTION_ICON: Record<string, string> = {
  'flag.update':'🚩', 'user.ban':'🔒', 'user.unban':'🔓',
  'plan.change':'💳', 'quiz.delete':'🗑', 'score.delete':'🗑',
}

function DiffView({ oldData, newData }: { oldData: Record<string, unknown> | null; newData: Record<string, unknown> | null }) {
  if (!oldData && !newData) return null
  const keys = Array.from(new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]))
  const changed = keys.filter((k) => JSON.stringify((oldData ?? {})[k]) !== JSON.stringify((newData ?? {})[k]))
  if (changed.length === 0) return null

  return (
    <div className="mt-3 text-xs font-mono space-y-1">
      {changed.map((k) => (
        <div key={k} className="grid grid-cols-[auto_1fr_1fr] gap-x-3 items-start">
          <span className="text-gray-400 col-span-1">{k}:</span>
          {oldData?.[k] !== undefined && (
            <span className="text-danger/80 bg-danger/5 px-1 rounded line-through">
              {JSON.stringify(oldData[k])}
            </span>
          )}
          {newData?.[k] !== undefined && (
            <span className="text-success bg-success/5 px-1 rounded">
              {JSON.stringify(newData[k])}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AdminAuditPage() {
  const [logs,       setLogs]       = useState<AuditLog[]>([])
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [hasMore,    setHasMore]    = useState(false)
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set())
  const [filterAction, setFilterAction] = useState('all')
  const [filterResource, setFilterResource] = useState('all')
  const PER_PAGE = 25

  const load = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    const sb = getBrowserClient()

    let query = sb
      .from('audit_logs')
      .select('id, actor_id, action, resource_type, resource_id, old_data, new_data, ip_address, created_at, profiles!actor_id(full_name, email)')
      .order('created_at', { ascending: false })
      .range((p - 1) * PER_PAGE, p * PER_PAGE - 1)

    if (filterAction !== 'all')    query = query.eq('action', filterAction)
    if (filterResource !== 'all')  query = query.eq('resource_type', filterResource)

    const { data } = await query
    const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      ...r,
      actor: Array.isArray(r['profiles']) ? (r['profiles'][0] ?? null) : (r['profiles'] ?? null),
    })) as AuditLog[]

    setLogs((prev) => append ? [...prev, ...rows] : rows)
    setHasMore(rows.length === PER_PAGE)
    setPage(p)
    setLoading(false)
  }, [filterAction, filterResource])

  useEffect(() => { load(1) }, [load])

  function toggleExpand(id: string) {
    setExpanded((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // Unique action/resource types from loaded logs for filter dropdowns
  const uniqueActions   = [...new Set(logs.map((l) => l.action))]
  const uniqueResources = [...new Set(logs.map((l) => l.resource_type))]

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="font-display font-bold text-xl text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500">Lịch sử hành động của Admin — bất biến, chỉ đọc</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
            className="border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Tất cả hành động</option>
            {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)}
            className="border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Tất cả resource</option>
            {uniqueResources.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {(filterAction !== 'all' || filterResource !== 'all') && (
            <button onClick={() => { setFilterAction('all'); setFilterResource('all') }}
              className="text-xs text-gray-500 hover:text-primary">× Xóa bộ lọc</button>
          )}
          <span className="ml-auto text-xs text-gray-400">{logs.length} bản ghi</span>
        </div>

        {/* Log list */}
        {loading && logs.length === 0 ? (
          <div className="space-y-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-card" />)}</div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-card shadow-card py-16 text-center">
            <span className="text-4xl">📋</span>
            <p className="text-gray-500 text-sm mt-3">Chưa có audit log nào.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {logs.map((log) => {
                const isExp   = expanded.has(log.id)
                const color   = ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-500'
                const icon    = ACTION_ICON[log.action]   ?? '📝'
                const hasDiff = log.old_data || log.new_data

                return (
                  <div key={log.id} className="bg-white rounded-card border border-gray-100 overflow-hidden">
                    <button onClick={() => hasDiff && toggleExpand(log.id)}
                      className={`w-full flex items-start gap-4 px-4 py-3.5 text-left ${hasDiff ? 'cursor-pointer hover:bg-gray-50/60' : 'cursor-default'} transition-colors`}>
                      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{log.action}</span>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{log.resource_type}</span>
                          {log.resource_id && (
                            <code className="text-xs text-gray-400 font-mono">{log.resource_id.slice(0, 8)}…</code>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                          {log.actor && (
                            <span>👤 {log.actor.full_name || log.actor.email}</span>
                          )}
                          {log.ip_address && <span>🌐 {log.ip_address}</span>}
                          <span>{new Date(log.created_at).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                      </div>
                      {hasDiff && (
                        <span className="text-gray-300 text-xs flex-shrink-0 mt-1">{isExp ? '▲' : '▼'}</span>
                      )}
                    </button>

                    {isExp && hasDiff && (
                      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 animate-fade-in">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Thay đổi</p>
                        <DiffView oldData={log.old_data} newData={log.new_data} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-2">
                <button onClick={() => load(page + 1, true)} disabled={loading}
                  className="text-sm text-primary font-medium hover:underline disabled:opacity-60 flex items-center gap-2 mx-auto">
                  {loading && <span className="h-3.5 w-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                  Tải thêm {PER_PAGE} bản ghi
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
