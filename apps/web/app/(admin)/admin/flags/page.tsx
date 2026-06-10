'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient }    from '../../../../lib/supabase'
import { FeatureFlagPanel }    from '../../../../components/admin/FeatureFlagPanel'

interface Flag {
  key:         string
  enabled:     boolean
  description: string | null
  rollout_pct: number
}

export default function AdminFlagsPage() {
  const [flags,   setFlags]   = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const sb = getBrowserClient()
      const { data, error: err } = await sb
        .from('feature_flags')
        .select('key, enabled, description, rollout_pct')
        .order('key', { ascending: true })

      if (err) { setError('Không tải được feature flags.'); setLoading(false); return }
      setFlags((data ?? []) as Flag[])
      setLoading(false)
    }
    load()
  }, [])

  const enabledCount = flags.filter((f) => f.enabled).length

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="font-display font-bold text-xl text-gray-900">Feature Flags</h1>
        <p className="text-sm text-gray-500">Bật/tắt tính năng theo từng môi trường</p>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-4 py-3">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Tổng flags',  value: flags.length,                color: 'text-gray-900' },
            { label: 'Đang bật',    value: enabledCount,                color: 'text-success' },
            { label: 'Đang tắt',   value: flags.length - enabledCount, color: 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-card shadow-card p-4 text-center">
              <p className={`font-display font-extrabold text-3xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="bg-warning/6 border border-warning/20 rounded-input px-4 py-3 text-sm text-warning flex gap-2">
          <span>⚠</span>
          <span>Thay đổi flag có hiệu lực ngay lập tức cho tất cả người dùng. Cẩn thận khi bật tính năng chưa hoàn thiện.</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="p-6 space-y-4 animate-pulse">
              {[1,2,3,4,5,6,7].map((i) => <div key={i} className="h-14 bg-gray-100 rounded" />)}
            </div>
          </div>
        ) : flags.length === 0 ? (
          <div className="bg-white rounded-card shadow-card py-16 text-center">
            <span className="text-4xl">🚩</span>
            <p className="text-gray-500 text-sm mt-3">Chưa có feature flags nào trong database.</p>
          </div>
        ) : (
          <FeatureFlagPanel flags={flags} />
        )}

        {/* Legend */}
        {!loading && flags.length > 0 && (
          <div className="text-xs text-gray-400 space-y-1 bg-white rounded-card shadow-card p-4">
            <p className="font-semibold text-gray-600 mb-2">Giải thích flags</p>
            {flags.map((f) => (
              <div key={f.key} className="flex items-start gap-2">
                <code className="font-mono text-gray-700 flex-shrink-0">{f.key}</code>
                <span>{f.description ?? 'Không có mô tả'}</span>
                {f.rollout_pct < 100 && (
                  <span className="text-warning ml-auto flex-shrink-0">Rollout {f.rollout_pct}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
