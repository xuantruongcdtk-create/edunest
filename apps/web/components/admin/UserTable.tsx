'use client'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Badge } from '../primitives/Badge'
import { EmptyState } from '../primitives/EmptyState'

interface UserRow {
  id:         string
  email:      string
  full_name:  string
  role:       string
  plan_tier:  string
  created_at: string
}

const ROLE_LABEL: Record<string, string>    = { parent: 'Phụ huynh', teacher: 'Giáo viên', bgh: 'BGH', admin: 'Admin' }
const ROLE_VARIANT: Record<string, string>  = { parent: 'primary', teacher: 'success', bgh: 'accent', admin: 'danger' }
const PLAN_VARIANT: Record<string, string>  = { free: 'neutral', basic: 'primary', pro: 'accent', school: 'success' }

interface UserTableProps extends HTMLAttributes<HTMLDivElement> {
  users: UserRow[]
}

export const UserTable = forwardRef<HTMLDivElement, UserTableProps>(
  ({ className, users, ...props }, ref) => (
    <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-display font-semibold text-gray-800">Người dùng gần đây</h3>
      </div>
      {users.length === 0 ? (
        <EmptyState icon="👥" title="Chưa có người dùng" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Họ tên</th>
                <th className="text-left px-6 py-3 font-medium">Email</th>
                <th className="text-left px-6 py-3 font-medium">Vai trò</th>
                <th className="text-left px-6 py-3 font-medium">Gói</th>
                <th className="text-left px-6 py-3 font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{u.full_name}</td>
                  <td className="px-6 py-3 text-gray-500">{u.email}</td>
                  <td className="px-6 py-3">
                    <Badge variant={ROLE_VARIANT[u.role] as 'primary'}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={PLAN_VARIANT[u.plan_tier] as 'primary'}>{u.plan_tier}</Badge>
                  </td>
                  <td className="px-6 py-3 text-gray-500 tabular-nums">
                    {new Date(u.created_at).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  ),
)
UserTable.displayName = 'UserTable'
