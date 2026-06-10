'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface UserContextValue {
  userId:   string
  userName: string
  role:     string
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({
  userId, userName, role, children,
}: UserContextValue & { children: ReactNode }) {
  return (
    <UserContext.Provider value={{ userId, userName, role }}>
      {children}
    </UserContext.Provider>
  )
}

/** Read pre-fetched user from layout — no extra network call. */
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}
