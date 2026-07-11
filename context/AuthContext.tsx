'use client'

import { createContext, useContext, useState, useEffect, useLayoutEffect, type ReactNode } from 'react'

// Runs before first paint on client; falls back to useEffect on server (SSR-safe)
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
import { loginApi, parseLoginError, type LoginUser } from '@/lib/api/auth'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone: string
  role: string
  status: string
  initials: string
  branch: number
  branch_name: string
}

interface AuthContextType {
  user: AuthUser | null
  hydrated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY        = 'xantara_pos_user'
const ACCESS_TOKEN_KEY   = 'xantara_pos_access'
const REFRESH_TOKEN_KEY  = 'xantara_pos_refresh'

function userFromApi(u: LoginUser): AuthUser {
  return {
    id:          u.id,
    name:        u.name,
    email:       u.email,
    phone:       u.phone,
    role:        u.role,
    status:      u.status,
    initials:    u.initials,
    branch:      u.branch,
    branch_name: u.branch_detail.name,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,     setUser]     = useState<AuthUser | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useIsomorphicLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored) as AuthUser)
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true)
  }, [])

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await loginApi(email, password)
      const authUser = userFromApi(data.user)

      setUser(authUser)
      localStorage.setItem(STORAGE_KEY,       JSON.stringify(authUser))
      localStorage.setItem(ACCESS_TOKEN_KEY,  data.access)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)

      return { success: true }
    } catch (err) {
      return { success: false, error: parseLoginError(err) }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  const getAccessToken = (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null

  return (
    <AuthContext.Provider value={{ user, hydrated, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
