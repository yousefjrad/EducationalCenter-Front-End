import { api } from './api'

export type EnrollmentStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Transferred' | 'Completed'
export type WaitingStatus = 'Waiting' | 'Promoted' | 'Cancelled'

export interface EnrollmentDto {
  id: number
  studentId: number
  studentName: string
  sectionId: number
  sectionName: string
  courseName: string
  agreedPrice: number
  status: EnrollmentStatus
  enrolledAt: string
  holdExpiresAt: string | null
  transferredFromEnrollmentId: number | null
}

export interface WaitingEntryDto {
  id: number
  studentId: number
  studentName: string
  studentPhone: string
  sectionId: number
  sectionName: string
  position: number
  status: WaitingStatus
  addedAt: string
  promotedEnrollmentId: number | null
}

export interface Page<T> {
  items: T[]
  totalCount?: number
  total?: number
}

const qs = (q: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams()
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, String(v))
  })
  return p.toString()
}

export const enrollmentsApi = {
  list: (q: { sectionId?: number; studentId?: number; status?: EnrollmentStatus | ''; page?: number; pageSize?: number }) =>
    api.get(`/enrollments?${qs(q)}`) as Promise<Page<EnrollmentDto>>,
  create: (body: { studentId: number; sectionId: number; asHold: boolean }) =>
    api.post('/enrollments', body) as Promise<EnrollmentDto>,
  confirm: (id: number) => api.post(`/enrollments/${id}/confirm`, {}) as Promise<EnrollmentDto>,
  cancel: (id: number) => api.post(`/enrollments/${id}/cancel`, {}) as Promise<EnrollmentDto>,
  transfer: (id: number, targetSectionId: number) =>
    api.post(`/enrollments/${id}/transfer`, { targetSectionId }) as Promise<EnrollmentDto>,
}

export const waitingApi = {
  list: (q: { sectionId?: number; status?: WaitingStatus | ''; page?: number; pageSize?: number }) =>
    api.get(`/waiting-list?${qs(q)}`) as Promise<Page<WaitingEntryDto>>,
  add: (body: { studentId: number; sectionId: number }) =>
    api.post('/waiting-list', body) as Promise<WaitingEntryDto>,
  cancel: (id: number) => api.post(`/waiting-list/${id}/cancel`, {}) as Promise<WaitingEntryDto>,
  promote: (id: number, asHold: boolean) =>
    api.post(`/waiting-list/${id}/promote`, { asHold }) as Promise<EnrollmentDto>,
}