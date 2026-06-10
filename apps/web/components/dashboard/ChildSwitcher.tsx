'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '../../lib/cn'

interface Child { id: string; full_name: string; grade: number }

interface ChildSwitcherProps extends HTMLAttributes<HTMLDivElement> {
  kids:          Child[]
  activeChildId: string
}

export const ChildSwitcher = forwardRef<HTMLDivElement, ChildSwitcherProps>(
  ({ className, kids, activeChildId, ...props }, ref) => {
    const router       = useRouter()
    const searchParams = useSearchParams()

    const switchChild = (childId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('childId', childId)
      router.push(`?${params.toString()}`)
    }

    if (kids.length <= 1) return null

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
        <span className="text-sm text-gray-500 mr-1">Xem con:</span>
        {kids.map((child) => (
          <button
            key={child.id}
            onClick={() => switchChild(child.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              child.id === activeChildId
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {child.full_name.charAt(0)}
            </span>
            {child.full_name} · Lớp {child.grade}
          </button>
        ))}
      </div>
    )
  },
)
ChildSwitcher.displayName = 'ChildSwitcher'
