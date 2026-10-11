import { api } from './api'

export type SessionStatus = 'Scheduled' | 'Held' | 'Postponed' | 'Cancelled'

export interface ClassSessionDto {
  id: number
  sectionId: number
  sectionName: string
  date: string
  startTime: string
  endTime: string
  roomId: number
  roomName: string
  trainerId: number
  trainerName: string
  status: SessionStatus
  notes: string | null
}

export interface SessionsPage {
  items: ClassSessionDto[]
  totalCount: number
}

const BASE = '/class-sessions'

export const toApiTime = (t: string) => (t.length === 5 ? `${t}:00` : t)

export interface SessionsQuery {
  from?: string
  to?: string
  sectionId?: number
  status?: SessionStatus
  page?: number
  pageSize?: number
}

export const sessionsApi = {
  list: (q: SessionsQuery) => {
    const p = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== '') p.set(k, String(v))
    })
    return api.get(`${BASE}?${p.toString()}`) as Promise<SessionsPage>
  },
  generate: (sectionId: number) =>
    api.post(`${BASE}/generate/${sectionId}`, {}) as Promise<ClassSessionDto[]>,
  postpone: (id: number, body: { newDate: string; newStartTime: string; newEndTime: string; reason?: string }) =>
    api.post(`${BASE}/${id}/postpone`, body) as Promise<ClassSessionDto>,
  cancel: (id: number, body: { reason?: string }) =>
    api.post(`${BASE}/${id}/cancel`, body) as Promise<ClassSessionDto>,
}