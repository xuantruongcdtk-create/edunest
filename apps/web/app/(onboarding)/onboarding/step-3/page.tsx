'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '../../../../lib/supabase'

const SUBJECTS = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'GDCD']

const NOTIFY_OPTIONS = [
  { key: 'email',        label: 'Email',          icon: '📧', desc: 'Báo cáo tuần hàng tuần' },
  { key: 'score_drop',   label: 'Điểm giảm',      icon: '📉', desc: 'Khi điểm giảm bất thường' },
  { key: 'quiz_missed',  label: 'Quiz bỏ lỡ',     icon: '📝', desc: 'Khi con bỏ bài kiểm tra' },
  { key: 'burnout',      label: 'Nguy cơ kiệt sức', icon: '⚠️', desc: 'Phát hiện sớm dấu hiệu' },
]

export default function OnboardingStep3() {
  const router = useRouter()

  const [targetScore,    setTargetScore]    = useState(8)
  const [focusSubjects,  setFocusSubjects]  = useState<string[]>([])
  const [notifications,  setNotifications]  = useState<string[]>(['email', 'score_drop'])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  function toggleSubject(s: string) {
    setFocusSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function toggleNotify(k: string) {
    setNotifications((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Get first child to insert score target
    const { data: children } = await sb
      .from('children')
      .select('id')
      .eq('parent_id', user.id)
      .limit(1)

    const childId = (children as { id: string }[] | null)?.[0]?.id

    if (childId && focusSubjects.length > 0) {
      const now  = new Date()
      const year = now.getMonth() >= 7
        ? `${now.getFullYear()}-${now.getFullYear() + 1}`
        : `${now.getFullYear() - 1}-${now.getFullYear()}`

      await sb.from('score_targets').upsert(
        focusSubjects.map((subject) => ({
          child_id:      childId,
          subject,
          target_score:  targetScore,
          academic_year: year,
        }))
      )
    }

    setLoading(false)
    router.push('/onboarding/step-4')
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-1">
          Thiết lập mục tiêu
        </h1>
        <p className="text-sm text-gray-500">
          Đặt kỳ vọng và chọn cách nhận thông báo phù hợp với bạn.
        </p>
      </div>

      {error && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target score */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Điểm trung bình mục tiêu</label>
            <span className="font-display font-extrabold text-2xl text-primary">{targetScore}<span className="text-sm text-gray-400">/10</span></span>
          </div>
          <input
            type="range"
            min={5}
            max={10}
            step={0.5}
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full accent-primary h-2 rounded-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5.0</span>
            <span>7.5</span>
            <span>10.0</span>
          </div>
        </div>

        {/* Focus subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Môn học cần chú ý <span className="text-gray-400 font-normal">(chọn nhiều)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSubject(s)}
                className={`px-3 py-1.5 rounded-chip text-sm font-medium transition-colors ${
                  focusSubjects.includes(s)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nhận thông báo khi</label>
          <div className="space-y-2">
            {NOTIFY_OPTIONS.map(({ key, label, icon, desc }) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-card border cursor-pointer transition-colors ${
                  notifications.includes(key)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={notifications.includes(key)}
                  onChange={() => toggleNotify(key)}
                  className="accent-primary h-4 w-4 flex-shrink-0"
                />
                <span className="text-lg">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/onboarding/step-2')}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-btn hover:bg-gray-50 transition-colors"
          >
            ← Quay lại
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? 'Đang lưu...' : 'Hoàn tất →'}
          </button>
        </div>
      </form>
    </div>
  )
}
