'use client'
import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { UserProvider } from '../../lib/user-context'

interface DashboardLayoutProps {
  role:     'parent' | 'teacher' | 'bgh' | 'admin'
  userName: string
  userId:   string
  children: ReactNode
}

export function DashboardLayout({ role, userName, userId, children }: DashboardLayoutProps) {
  return (
    <UserProvider userId={userId} userName={userName} role={role}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role={role} userName={userName} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </UserProvider>
  )
}
