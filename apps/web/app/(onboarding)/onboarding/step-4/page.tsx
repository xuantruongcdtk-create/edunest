'use client'

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { getBrowserClient }    from '../../../../lib/supabase'

export default function OnboardingStep4() {
  const router = useRouter()
  const [name,     setName]     = useState('')
  const [role,     setRole]     = useState('parent')
  const [children, setChildren] = useState<{ full_name: string; grade: number }[]>([])

  useEffect(() => {
    async function load() {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [profileRes, childrenRes] = await Promise.all([
        sb.from('profiles').select('full_name, role').eq('id', user.id).single(),
        sb.from('children').select('full_name, grade').eq('parent_id', user.id).limit(4),
      ])

      const p = profileRes.data as { full_name: string; role: string } | null
      setName(p?.full_name ?? 'bạn')
      setRole(p?.role ?? 'parent')
      setChildren((childrenRes.data ?? []) as { full_name: string; grade: number }[])
    }
    load()
  }, [router])

  const dashboardPath =
    role === 'teacher' ? '/teacher/dashboard' :
    role === 'bgh'     ? '/bgh/dashboard' :
    role === 'admin'   ? '/admin/dashboard' :
    '/parent/dashboard'

  return (
    <div className="p-8 text-center">
      {/* Success animation */}
      <div className="relative mx-auto h-20 w-20 mb-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-4xl animate-bounce">🎉</span>
        </div>
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-success flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      </div>

      <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-2">
        Chào mừng, {name}!
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Tài khoản của bạn đã được thiết lập xong. Hãy bắt đầu hành trình theo dõi việc học cùng EduNest.
      </p>

      {/* Summary */}
      {children.length > 0 && (
        <div className="bg-gray-50 rounded-card p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Đã thêm</p>
          <ul className="space-y-1.5">
            {children.map((c) => (
              <li key={c.full_name} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">👦</span>
                <span className="font-medium">{c.full_name}</span>
                <span className="text-gray-400">· Lớp {c.grade}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Features preview */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { icon: '📊', title: 'Theo dõi điểm',   desc: 'Nhập điểm và xem xu hướng' },
          { icon: '🤖', title: 'AI Coach',          desc: 'Chat và nhận tư vấn học tập' },
          { icon: '🔔', title: 'Cảnh báo sớm',     desc: 'Phát hiện kịp thời khi có vấn đề' },
          { icon: '🧬', title: 'Learning DNA',      desc: 'Hiểu phong cách học của con' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-gray-50 rounded-card p-3 text-left">
            <span className="text-xl">{icon}</span>
            <p className="text-xs font-semibold text-gray-800 mt-1">{title}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      <Link
        href={dashboardPath}
        className="block w-full bg-primary text-white font-bold text-sm py-3 rounded-btn hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
      >
        Bắt đầu khám phá →
      </Link>

      <p className="text-xs text-gray-400 mt-4">
        Bạn có thể bổ sung thêm thông tin sau trong phần Cài đặt.
      </p>
    </div>
  )
}
