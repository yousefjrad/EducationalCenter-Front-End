/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearSession, getAccessToken, setSession } from '@/services/api'
import { setActivePermissions } from '@/lib/permissions'

export interface AuthUser {
  id: number
  name: string
  email: string
  roleName: string
}

interface AuthCtx {
  user: AuthUser | null
  permissions: string[]
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

function toUser(dto: any): AuthUser {
  const email = dto?.email ?? ''
  return {
    id: dto?.id ?? 0,
    name: dto?.fullName ?? dto?.name ?? dto?.userName ?? email,
    email,
    roleName: dto?.roleName ?? dto?.role?.name ?? (typeof dto?.role === 'string' ? dto.role : ''),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(() => !!getAccessToken())

  const apply = useCallback((me: any) => {
    const perms: string[] = me?.permissions ?? []
    setActivePermissions(perms)
    setPermissions(perms)
    setUser(toUser(me?.user))
  }, [])

  const reset = useCallback(() => {
    setActivePermissions([])
    setPermissions([])
    setUser(null)
  }, [])

  useEffect(() => {
    if (!getAccessToken()) return
    let alive = true
    api.get('/auth/me')
      .then((me) => { if (alive) apply(me) })
      .catch(() => { clearSession(); if (alive) reset() })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [apply, reset])

  useEffect(() => {
    const h = () => reset()
    window.addEventListener('auth:logout', h)
    return () => window.removeEventListener('auth:logout', h)
  }, [reset])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email: email.trim(), password })
    setSession(res)
    const me = await api.get('/auth/me')
    apply(me)
  }, [apply])

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken')
    try { if (rt) await api.post('/auth/logout', { refreshToken: rt }) } catch { /* ignore */ }
    clearSession()
    reset()
  }, [reset])

  const value = useMemo(() => ({ user, permissions, loading, login, logout }), [user, permissions, loading, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}