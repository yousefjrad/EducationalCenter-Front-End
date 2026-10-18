import { api } from '@/services/api'
import type { Paged } from '@/services/common'

export interface StudentDto {
  id: number
  fullName: string
  phoneNumber: string
  isActive: boolean
  branchId?: number
}

export interface StudentInput {
  fullName: string
  phoneNumber: string
}

export const studentsApi = {
  list: (params?: { search?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get<Paged<StudentDto>>('/students', params),
  create: (body: StudentInput) => api.post<StudentDto>('/students', body),
  update: (id: number, body: StudentInput & { isActive: boolean }) => api.put<StudentDto>('/students/' + id, body),
  remove: (id: number) => api.delete<unknown>('/students/' + id),
  transfer: (id: number, body: { targetBranchId: number; reason: string }) =>
    api.post<unknown>('/students/' + id + '/transfer', body),
  createAccount: (id: number, body: { email: string; password: string }) =>
    api.post<unknown>('/students/' + id + '/account', body),
}