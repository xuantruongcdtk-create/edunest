'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/cn'
import { getBrowserClient } from '../../lib/supabase'

interface NavItem { href: string; label: string; icon: string }

const PARENT_NAV: NavItem[]  = [
  { href: '/parent/dashboard',   label: 'Tổng quan',    icon: '⊞' },
  { href: '/parent/scores',      label: 'Bảng điểm',    icon: '📊' },
  { href: '/parent/quiz',        label: 'Bài kiểm tra', icon: '📝' },
  { href: '/parent/join-class',  label: 'Tham gia lớp', icon: '🏫' },
  { href: '/parent/coach',       label: 'EduCoach AI',  icon: '🤖' },
  { href: '/parent/children',    label: 'Hồ sơ con',    icon: '👦' },
  { href: '/parent/reports',     label: 'Báo cáo',      icon: '📄' },
  { href: '/settings',           label: 'Cài đặt',      icon: '⚙' },
]
const TEACHER_NAV: NavItem[] = [
  { href: '/teacher/dashboard',   label: 'Tổng quan',    icon: '⊞' },
  { href: '/teacher/classes',     label: 'Lớp học',      icon: '🏫' },
  { href: '/teacher/join-school', label: 'Tham gia trường', icon: '🔗' },
  { href: '/teacher/students',    label: 'Học sinh',     icon: '👥' },
  { href: '/teacher/quiz',        label: 'Bài kiểm tra', icon: '📝' },
  { href: '/teacher/alerts',      label: 'Cảnh báo',     icon: '🔔' },
  { href: '/settings',            label: 'Cài đặt',      icon: '⚙' },
]
const BGH_NAV: NavItem[] = [
  { href: '/bgh/dashboard',     label: 'Tổng quan',    icon: '⊞' },
  { href: '/bgh/classes',       label: 'Lớp học',      icon: '🏫' },
  { href: '/bgh/reports',       label: 'Báo cáo',      icon: '📄' },
  { href: '/settings',          label: 'Cài đặt',      icon: '⚙' },
]
const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard',   label: 'Tổng quan',    icon: '⊞' },
  { href: '/admin/users',       label: 'Người dùng',   icon: '👥' },
  { href: '/admin/flags',       label: 'Feature Flags', icon: '🚩' },
  { href: '/admin/audit',       label: 'Audit Log',    icon: '📋' },
  { href: '/settings',          label: 'Cài đặt',      icon: '⚙' },
]

const NAV_MAP: Record<string, NavItem[]> = {
  parent:  PARENT_NAV,
  teacher: TEACHER_NAV,
  bgh:     BGH_NAV,
  admin:   ADMIN_NAV,
}

const BRAND_COLOR: Record<string, string> = {
  parent:  'text-primary',
  teacher: 'text-primary',
  bgh:     'text-bgh-blue',
  admin:   'text-accent',
}

interface SidebarProps extends HTMLAttributes<HTMLElement> {
  role: 'parent' | 'teacher' | 'bgh' | 'admin'
  userName: string
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ className, role, userName, ...props }, ref) => {
    const pathname = usePathname()
    const items    = NAV_MAP[role] ?? PARENT_NAV

    async function handleLogout() {
      const sb = getBrowserClient()
      // scope 'local': xóa phiên + cookie ở client ngay, không gọi endpoint logout server
      // (tránh lỗi 400 + chậm). Full reload thay vì router.replace để request mới tới /login
      // mang cookie đã xóa → middleware không còn thấy user → hết nhấp nháy redirect.
      await sb.auth.signOut({ scope: 'local' })
      window.location.assign('/login')
    }

    return (
      <aside
        ref={ref}
        className={cn(
          'flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 shadow-card',
          className,
        )}
        {...props}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <span className={cn('font-display font-extrabold text-xl', BRAND_COLOR[role])}>
            EduNest
          </span>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{role}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/8 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-danger/8 hover:text-danger transition-colors"
          >
            <span className="text-base w-5 text-center">↩</span>
            Đăng xuất
          </button>
        </div>
      </aside>
    )
  },
)
Sidebar.displayName = 'Sidebar'
