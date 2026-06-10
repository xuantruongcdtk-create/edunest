'use client'
import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  role:     'parent' | 'teacher' | 'bgh' | 'admin'
  userName: string
  children: ReactNode
}

export function DashboardLayout({ role, userName, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} userName={userName} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
