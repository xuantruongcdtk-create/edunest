'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('animate-pulse motion-safe:animate-pulse rounded-md bg-gray-200', className)}
      {...props}
    />
  ),
)
Skeleton.displayName = 'Skeleton'
