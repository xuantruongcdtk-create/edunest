'use client'

import { useState, useEffect, useCallback } from 'react'

interface UserRow {
  id:         string
  email:      string
  full_name:  string
  role:       string
  plan_tier:  string
  created_at: string
}

interface Meta { page: number; perPage: number; total: number; totalPages: number }

const ROLE_LABEL:    Record<string, string> = { parent: 'Phụ huynh', teacher: 'Giáo viên', bgh: 'BGH', admin: 'Admin' }
const ROLE_CHIP:     Record<string, string> = { parent: 'bg-primary/10 text-primary', teacher: 'bg-success/10 text-success', bgh: 'bg-[#185FA5]/10 text-[#185FA5]', admin: 'bg-danger/10 text-danger' }
const PLAN_CHIP:     Record<string, string> = { free: 'bg-gray-100 text-gray-500', basic: 'bg-primary/10 text-primary', pro: 'bg-accent/10 text-accent', school: 'bg-success/10 text-success' }

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState<UserRow[]>([])
  const [meta,     setMeta]     = useState<Meta | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    const res = await fetch(`/api/v1/admin/users?${params}`)
    if (!res.ok) { setLoading(false); return }
    const json = await res.json() as { data: UserRow[]; meta: Meta }
    setUsers(json.data ?? [])
    setMeta(json.meta ?? null)
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  // Client-side filter on top of server data
  const filtered = users.filter((u) => {
    const matchSearch = debouncedSearch === ''
      || u.full_name.toLowerCase().includes(debouncedSearch.toLowerCase())
      || u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchPlan = planFilter === 'all' || u.plan_tier === planFilter
    return matchSearch && matchRole && matchPlan
  })

  const roleCount = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1; return acc
  }, {})
  const planCount = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.plan_tier] = (acc[u.plan_tier] ?? 0) + 1; return acc
  }, {})

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="font-display font-bold text-xl text-gray-900">Người dùng</h1>
        <p className="text-sm text-gray-500">Quản lý tài khoản và gói dịch vụ</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng',         value: meta?.total ?? users.length,   color: 'text-gray-900' },
            { label: 'Phụ huynh',    value: roleCount['parent']  ?? 0,    color: 'text-primary' },
            { label: 'Giáo viên',    value: roleCount['teacher'] ?? 0,    color: 'text-success' },
            { label: 'Gói trả phí',  value: (roleCount['basic'] ?? 0) + (roleCount['pro'] ?? 0) + (planCount['basic'] ?? 0) + (planCount['pro'] ?? 0) + (planCount['school'] ?? 0), color: 'text-accent' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-card shadow-card p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`font-display font-extrabold text-2xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm tên hoặc email..."
              className="w-full border border-gray-200 rounded-input pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Tất cả vai trò</option>
            <option value="parent">Phụ huynh</option>
            <option value="teacher">Giáo viên</option>
            <option value="bgh">BGH</option>
            <option value="admin">Admin</option>
          </select>
          <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Tất cả gói</option>
            <option value="free">Miễn phí</option>
            <option value="basic">Cơ bản</option>
            <option value="pro">Nâng cao</option>
            <option value="school">Trường học</option>
          </select>
          {(search || roleFilter !== 'all' || planFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setRoleFilter('all'); setPlanFilter('all'); setPage(1) }}
              className="text-xs text-gray-500 hover:text-primary">× Xóa bộ lọc</button>
          )}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} / {meta?.total ?? '…'} người dùng</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3 animate-pulse">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl">👥</span>
              <p className="text-gray-500 text-sm mt-3">{users.length === 0 ? 'Chưa có người dùng' : 'Không có kết quả khớp bộ lọc'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Họ tên', 'Email', 'Vai trò', 'Gói', 'Ngày đăng ký'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {(u.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_CHIP[u.role] ?? 'bg-gray-100 text-gray-500'}`}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_CHIP[u.plan_tier] ?? 'bg-gray-100 text-gray-500'}`}>
                          {u.plan_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 tabular-nums whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-input border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              ←
            </button>
            <span className="text-sm text-gray-600">Trang {page} / {meta.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
              className="px-3 py-1.5 rounded-input border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
