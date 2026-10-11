import { api } from './api'

export interface AuditLogDto {
  id: number
  userId: number
  userName: string
  action: string
  entityName: string
  entityId: number
  oldValues: string | null
  newValues: string | null
  reason: string | null
  createdAt: string
}

export interface AuditPage {
  items: AuditLogDto[]
  totalCount?: number
  total?: number
}

export const auditApi = {
  list: (q: { entityName?: string; action?: string; from?: string; to?: string; page?: number; pageSize?: number }) => {
    const p = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== '') p.set(k, String(v))
    })
    return api.get(`/audit-logs?${p.toString()}`) as Promise<AuditPage>
  },
}