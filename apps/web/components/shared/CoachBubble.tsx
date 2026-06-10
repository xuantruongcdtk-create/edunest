'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'

interface CoachBubbleProps extends HTMLAttributes<HTMLDivElement> {
  lastMessage?: string
  href?:        string
}

export const CoachBubble = forwardRef<HTMLDivElement, CoachBubbleProps>(
  ({ className, lastMessage, href = '/coach', ...props }, ref) => (
    <Card ref={ref} className={cn('p-5 bg-gradient-to-br from-primary/5 to-accent/5', className)} {...props}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-lg flex-shrink-0">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-gray-800 text-sm">EduCoach AI</p>
          {lastMessage ? (
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{lastMessage}</p>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">
              Hỏi tôi bất kỳ điều gì về việc học của con bạn.
            </p>
          )}
          <Link
            href={href}
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
          >
            Mở cuộc trò chuyện →
          </Link>
        </div>
      </div>
    </Card>
  ),
)
CoachBubble.displayName = 'CoachBubble'
