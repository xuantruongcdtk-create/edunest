'use client'

import { useState, useEffect } from 'react'
import { useSearchParams }     from 'next/navigation'
import { Suspense }            from 'react'
import { CoachChat }           from '../../../../components/chat/CoachChat'
import { getBrowserClient }    from '../../../../lib/supabase'
import { useUser }             from '../../../../lib/user-context'

function CoachPageInner() {
  const { userId }   = useUser()
  const searchParams = useSearchParams()
  const urlChildId   = searchParams.get('childId') ?? undefined

  const [children, setChildren]  = useState<{ id: string; full_name: string; grade: number }[]>([])
  const [activeId,  setActiveId] = useState<string | undefined>(urlChildId)

  useEffect(() => {
    async function load() {
      const sb = getBrowserClient()

      const { data } = await sb
        .from('children')
        .select('id, full_name, grade')
        .eq('parent_id', userId)
        .order('created_at')

      const kids = (data ?? []) as { id: string; full_name: string; grade: number }[]
      setChildren(kids)
      if (!activeId && kids.length > 0) setActiveId(kids[0]!.id)
    }
    load()
  }, [userId, activeId])

  const activeChild = children.find((c) => c.id === activeId)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-lg">🤖</div>
          <div>
            <h1 className="font-display font-bold text-gray-900">EduCoach AI</h1>
            <p className="text-xs text-gray-400">
              {activeChild ? `Đang tư vấn cho ${activeChild.full_name} · Lớp ${activeChild.grade}` : 'Chọn học sinh để bắt đầu'}
            </p>
          </div>
        </div>

        {/* Child switcher */}
        {children.length > 1 && (
          <div className="flex gap-1.5">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`px-3 py-1.5 rounded-chip text-xs font-medium transition-colors ${
                  c.id === activeId
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.full_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {activeChild && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-500 mb-2">Gợi ý câu hỏi:</p>
          <div className="flex flex-wrap gap-2">
            {[
              `${activeChild.full_name} học môn nào tốt nhất?`,
              'Làm sao để cải thiện điểm Toán?',
              'Con có dấu hiệu kiệt sức không?',
              'Lên kế hoạch ôn thi cuối kỳ',
            ].map((q) => (
              <span
                key={q}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-chip cursor-pointer hover:border-primary hover:text-primary transition-colors"
              >
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 min-h-0 p-4">
        {activeId ? (
          <CoachChat childId={activeId} className="h-full" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <span className="text-5xl mb-4">🤖</span>
            <p className="font-display font-bold text-gray-700 text-lg mb-2">EduCoach AI</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Hoàn tất onboarding để thêm thông tin con và bắt đầu nhận tư vấn cá nhân hóa.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CoachPage() {
  return (
    <Suspense>
      <CoachPageInner />
    </Suspense>
  )
}
