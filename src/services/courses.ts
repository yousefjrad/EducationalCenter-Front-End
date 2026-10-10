import { api } from '@/services/api'
import type { Paged } from '@/services/common'

export interface CourseDto {
  id: number
  code: string
  name: string
  description: string | null
  level: string | null
  defaultDurationHours: number
  defaultPrice: number
  isActive: boolean
}

export interface CourseInput {
  code: string
  name: string
  description: string | null
  level: string | null
  defaultDurationHours: number
  defaultPrice: number
}

export const coursesApi = {
  list: (params?: { search?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get<Paged<CourseDto>>('/courses', params),
  create: (body: CourseInput) => api.post<CourseDto>('/courses', body),
  update: (id: number, body: CourseInput & { isActive: boolean }) => api.put<CourseDto>('/courses/' + id, body),
}