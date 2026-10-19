import { api } from '@/services/api'
import type { Paged } from '@/services/common'

export interface RoomDto {
  id: number
  name: string
  capacity: number
  description: string | null
  location: string | null
  isActive: boolean
  rowVersion?: string | null
}

export interface RoomInput {
  name: string
  capacity: number
  description: string | null
  location: string | null
}

export const roomsApi = {
  list: (params?: { search?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get<Paged<RoomDto>>('/rooms', params),
  create: (body: RoomInput) => api.post<RoomDto>('/rooms', body),
  update: (id: number, body: RoomInput & { isActive: boolean; rowVersion?: string | null }) => api.put<RoomDto>('/rooms/' + id, body),
}