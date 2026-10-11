import { api } from './api'

export interface UserDto {
  id: number
  fullName: string
  email: string
  roleId: number
  roleName: string
  isActive: boolean
  lastLoginAt: string | null
  lockedUntil: string | null
}

export interface UserBody {
  fullName: string
  email: string
  roleId: number
  isActive: boolean
}

export interface RoleDto {
  id: number
  name: string
  description: string | null
  isSystem: boolean
  permissions: string[]
}

export interface PermissionGroupDto {
  module: string
  permissions: string[]
}

export interface RoleBody {
  name: string
  description: string | null
  permissionNames: string[]
}

export interface PageOf<T> {
  items: T[]
  totalCount?: number
  total?: number
}

const qs = (q: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams()
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, String(v))
  })
  return p.toString()
}

export const usersApi = {
  list: (q: { search?: string; roleId?: number; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get(`/users?${qs(q)}`) as Promise<PageOf<UserDto>>,
  create: (b: { fullName: string; email: string; password: string; roleId: number }) =>
    api.post('/users', b) as Promise<UserDto>,
  update: (id: number, b: UserBody) => api.put(`/users/${id}`, b) as Promise<UserDto>,
  unlock: (id: number) => api.post(`/users/${id}/unlock`, {}) as Promise<UserDto>,
  resetPassword: (id: number, newPassword: string) =>
    api.post(`/users/${id}/reset-password`, { newPassword }) as Promise<unknown>,
}

export const rolesApi = {
  list: () => api.get('/roles') as Promise<RoleDto[]>,
  permissions: () => api.get('/roles/permissions') as Promise<PermissionGroupDto[]>,
  create: (b: RoleBody) => api.post('/roles', b) as Promise<RoleDto>,
  update: (id: number, b: RoleBody) => api.put(`/roles/${id}`, b) as Promise<RoleDto>,
  remove: (id: number) => api.delete(`/roles/${id}`) as Promise<unknown>,
}