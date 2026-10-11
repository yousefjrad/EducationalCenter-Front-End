import { api } from '@/services/api'
import type { Paged } from '@/services/common'

export type SectionStatus = 'Draft' | 'OpenForEnrollment' | 'InProgress' | 'Completed' | 'Cancelled'

export interface SectionScheduleDto {
  dayOfWeek: string
  startTime: string
  endTime: string
}

export interface SectionDto {
  id: number
  courseId: number
  courseName: string
  trainerId: number
  trainerName: string
  roomId: number
  roomName: string
  name: string
  startDate: string
  endDate: string
  price: number
  capacity: number
  minStudents: number
  status: SectionStatus
  schedules: SectionScheduleDto[]
}

export interface SectionInput {
  trainerId: number
  roomId: number
  name: string
  startDate: string
  endDate: string
  capacity: number
  minStudents: number
  schedules: SectionScheduleDto[]
}

export const sectionsApi = {
  list: (params?: { search?: string; status?: SectionStatus; page?: number; pageSize?: number }) =>
    api.get<Paged<SectionDto>>('/sections', params),
  create: (body: SectionInput & { courseId: number; price: number | null }) => api.post<SectionDto>('/sections', body),
  update: (id: number, body: SectionInput & { price: number }) => api.put<SectionDto>('/sections/' + id, body),
  changeStatus: (id: number, status: SectionStatus) => api.post<SectionDto>('/sections/' + id + '/status', { status }),
  remove: (id: number) => api.delete<unknown>('/sections/' + id),
}