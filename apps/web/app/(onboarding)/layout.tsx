'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { getBrowserClient } from '../../lib/supabase'

interface Step { n: number; label: string; path: string }

// Phụ huynh / Giáo viên: 4 bước. BGH: 3 bước (bỏ "Mục tiêu", nhảy thẳng tới Hoàn tất).
const STEPS_BY_ROLE: Record<string, Step[]> = {
  parent: [
    { n: 1, label: 'Cá nhân',  path: '/onboarding/step-1' },
    { n: 2, label: 'Thêm con', path: '/onboarding/step-2' },
    { n: 3, label: 'Mục tiêu', path: '/onboarding/step-3' },
    { n: 4, label: 'Hoàn tất', path: '/onboarding/step-4' },
  ],
  teacher: [
    { n: 1, label: 'Cá nhân',  path: '/onboarding/step-1' },
    { n: 2, label: 'Giảng dạy', path: '/onboarding/step-2' },
    { n: 3, label: 'Mục tiêu', path: '/onboarding/step-3' },
    { n: 4, label: 'Hoàn tất', path: '/onboarding/step-4' },
  ],
  bgh: [
    { n: 1, label: 'Cá nhân',   path: '/onboarding/step-1' },
    { n: 2, label: 'Trường học', path: '/onboarding/step-2' },
    { n: 3, label: 'Hoàn tất',  path: '/onboarding/step-4' },
  ],
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [role, setRole] = useState<string>('parent')

  useEffect(() => {
    async function loadRole() {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data } = await sb.from('profiles').select('role').eq('id', user.id).single()
      const r = (data as { role: string } | null)?.role ?? user.user_metadata?.role ?? 'parent'
      setRole(r)
    }
    loadRole()
  }, [])

  const STEPS   = STEPS_BY_ROLE[role] ?? STEPS_BY_ROLE.parent
  const current = STEPS.findIndex((s) => pathname.startsWith(s.path)) + 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="text-2xl">🎓</span>
        <span className="font-display font-extrabold text-xl text-primary">EduNest</span>
      </Link>

      {/* Step bar */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const done    = s.n < current
          const active  = s.n === current

          return (
            <div key={s.n} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done   ? 'bg-primary text-white' :
                  active ? 'bg-primary text-white ring-4 ring-primary/20' :
                           'bg-gray-100 text-gray-400'
                }`}>
                  {done ? '✓' : s.n}
                </div>
                <span className={`hidden sm:block text-xs font-medium ${active ? 'text-primary' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-4 transition-colors ${
                  s.n < current ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Card */}
      <div className="bg-white rounded-card shadow-card w-full max-w-md">
        {children}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Bước {current} / {STEPS.length} — Chỉ mất khoảng 2 phút
      </p>
    </div>
  )
}
