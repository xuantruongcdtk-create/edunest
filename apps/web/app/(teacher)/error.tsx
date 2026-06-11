'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[TeacherError boundary] message:', error?.message)
    console.error('[TeacherError boundary] stack:', error?.stack)
    console.error('[TeacherError boundary] full error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="font-display font-bold text-xl text-gray-900 mb-2">
        Đã xảy ra lỗi
      </h2>
      {/* Show actual error in development so we can debug */}
      <p className="text-sm text-danger font-mono bg-danger/5 border border-danger/20 rounded-input px-4 py-3 mb-2 max-w-xl text-left break-all">
        {error?.message || String(error) || 'Unknown error'}
      </p>
      {error?.stack && (
        <pre className="text-xs text-gray-600 font-mono bg-gray-50 border border-gray-200 rounded-input px-4 py-3 mb-4 max-w-xl text-left overflow-auto max-h-48 whitespace-pre-wrap">
          {error.stack}
        </pre>
      )}
      {error?.digest && (
        <p className="text-xs text-gray-400 mb-4">Digest: {error.digest}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-btn hover:bg-primary-dark transition-colors"
        >
          Thử lại
        </button>
        <Link
          href="/teacher/dashboard"
          className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2 rounded-btn hover:bg-gray-50 transition-colors"
        >
          Về Dashboard
        </Link>
      </div>
    </div>
  )
}
