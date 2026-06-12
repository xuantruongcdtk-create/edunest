'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { getBrowserClient }    from '../../../lib/supabase'

interface Profile {
  plan_tier:       string
  plan_status:     string
  plan_expires_at: string | null
}

interface Txn {
  id:         string
  provider:   string
  amount_vnd: number
  plan_tier:  string
  status:     string
  created_at: string
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Miễn phí', basic: 'Cơ bản', pro: 'Nâng cao', school: 'Trường học',
}
const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: 'Đang hoạt động', color: 'bg-success/10 text-success' },
  expired:   { label: 'Hết hạn',        color: 'bg-danger/10 text-danger' },
  trial:     { label: 'Dùng thử',       color: 'bg-warning/10 text-warning' },
  cancelled: { label: 'Đã huỷ',         color: 'bg-gray-100 text-gray-500' },
}
const TXN_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Đang xử lý', color: 'bg-warning/10 text-warning' },
  success:  { label: 'Thành công', color: 'bg-success/10 text-success' },
  failed:   { label: 'Thất bại',   color: 'bg-danger/10 text-danger' },
  refunded: { label: 'Đã hoàn',    color: 'bg-gray-100 text-gray-500' },
}

const PLANS = [
  {
    tier: 'basic', name: 'Cơ bản', price: 99000, period: 'tháng',
    features: ['Quiz không giới hạn', 'Phân tích điểm số', 'Cảnh báo học tập sớm'],
  },
  {
    tier: 'pro', name: 'Nâng cao', price: 199000, period: 'tháng', popular: true,
    features: ['Mọi tính năng gói Cơ bản', 'AI Coach 24/7', 'Learning DNA', 'Báo cáo nâng cao'],
  },
  {
    tier: 'school', name: 'Trường học', price: 990000, period: 'năm',
    features: ['Dashboard toàn trường', 'Quản lý lớp & giáo viên', 'Báo cáo & phân tích', 'Hỗ trợ riêng'],
  },
]

const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ'
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [txns,    setTxns]    = useState<Txn[]>([])
  const [loading, setLoading] = useState(true)
  const [paying,  setPaying]  = useState<string | null>(null)   // `${tier}:${provider}`
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setLoading(false); return }

    const [{ data: p }, { data: t }] = await Promise.all([
      sb.from('profiles').select('plan_tier, plan_status, plan_expires_at').eq('id', user.id).single(),
      (sb as any).from('payment_transactions')
        .select('id, provider, amount_vnd, plan_tier, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setProfile(p as Profile | null)
    setTxns((t ?? []) as Txn[])
    setLoading(false)
  }

  async function pay(tier: string, provider: 'momo' | 'vnpay') {
    setPaying(`${tier}:${provider}`); setError(null)
    try {
      const res  = await fetch(`/api/v1/payment/${provider}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planTier: tier }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((json as { error?: { message?: string } }).error?.message ?? 'Không tạo được giao dịch.')
        setPaying(null)
        return
      }
      const url = (json as { data?: { payUrl?: string } }).data?.payUrl
      if (url) { window.location.href = url }
      else { setError('Không nhận được liên kết thanh toán.'); setPaying(null) }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
      setPaying(null)
    }
  }

  const tier      = profile?.plan_tier ?? 'free'
  const isPaid    = tier !== 'free'
  const statusCfg = STATUS_LABEL[profile?.plan_status ?? 'trial'] ?? STATUS_LABEL.trial!
  const expiresAt = profile?.plan_expires_at
  const daysLeft  = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-gray-400 hover:text-gray-700 transition-colors">←</Link>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-gray-900">Quản lý gói dịch vụ</h1>
          <p className="text-sm text-gray-500 mt-0.5">Xem gói hiện tại, nâng cấp và lịch sử thanh toán.</p>
        </div>
      </div>

      {error && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-4 py-3">{error}</div>
      )}

      {/* Gói hiện tại */}
      <div className="bg-white rounded-card shadow-card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Gói hiện tại</h2>
        {loading ? (
          <div className="h-16 bg-gray-100 rounded-card animate-pulse" />
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-2xl text-gray-900">{PLAN_LABEL[tier] ?? tier}</span>
                {isPaid && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                )}
              </div>
              {isPaid && expiresAt && (
                <p className="text-sm text-gray-500 mt-1">
                  Hết hạn: <strong>{fmtDate(expiresAt)}</strong>
                  {daysLeft != null && daysLeft >= 0 && <span className="text-gray-400"> · còn {daysLeft} ngày</span>}
                  {daysLeft != null && daysLeft < 0 && <span className="text-danger"> · đã hết hạn</span>}
                </p>
              )}
              {!isPaid && (
                <p className="text-sm text-gray-500 mt-1">Nâng cấp để mở khoá AI Coach, báo cáo nâng cao và nhiều hơn nữa.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Các gói */}
      <div>
        <h2 className="font-display font-semibold text-gray-900 mb-3">Chọn gói nâng cấp</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = tier === plan.tier && (profile?.plan_status === 'active')
            return (
              <div key={plan.tier}
                className={`bg-white rounded-card shadow-card p-5 flex flex-col border-2 ${
                  plan.popular ? 'border-accent/40' : 'border-transparent'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-gray-900">{plan.name}</h3>
                  {plan.popular && <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Phổ biến</span>}
                </div>
                <p className="mb-4">
                  <span className="font-display font-extrabold text-2xl text-gray-900">{fmtVnd(plan.price)}</span>
                  <span className="text-sm text-gray-400"> /{plan.period}</span>
                </p>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-success mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center text-sm font-semibold text-success bg-success/8 rounded-btn py-2.5">
                    ✓ Gói hiện tại
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => pay(plan.tier, 'momo')}
                      disabled={paying !== null}
                      className="w-full bg-[#a50064] text-white text-sm font-semibold py-2.5 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                      {paying === `${plan.tier}:momo`
                        ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : '💜'} Thanh toán MoMo
                    </button>
                    <button
                      onClick={() => pay(plan.tier, 'vnpay')}
                      disabled={paying !== null}
                      className="w-full bg-[#005baa] text-white text-sm font-semibold py-2.5 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                      {paying === `${plan.tier}:vnpay`
                        ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : '🏦'} Thanh toán VNPAY
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Thanh toán an toàn qua cổng MoMo / VNPAY. Gói được kích hoạt tự động ngay sau khi thanh toán thành công.
        </p>
      </div>

      {/* Lịch sử giao dịch */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-semibold text-gray-900">Lịch sử thanh toán</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : txns.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-4xl">🧾</span>
            <p className="text-gray-500 text-sm mt-3">Chưa có giao dịch nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {txns.map((t) => {
              const st = TXN_STATUS[t.status] ?? TXN_STATUS.pending!
              return (
                <div key={t.id} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Gói {PLAN_LABEL[t.plan_tier] ?? t.plan_tier}
                      <span className="ml-2 text-xs text-gray-400 uppercase">{t.provider}</span>
                    </p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{fmtVnd(t.amount_vnd)}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
