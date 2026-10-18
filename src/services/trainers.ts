import { api } from '@/services/api'
import type { Paged } from '@/services/common'

export type PayType = 'Monthly' | 'Hourly' | 'Percentage'
export type PayCurrency = 'Syp' | 'Usd'

export interface TrainerDto {
  id: number
  fullName: string
  phoneNumber: string
  specialty: string | null
  payType: PayType
  payValue: number
  payCurrency: PayCurrency
  isActive: boolean
  branchIds?: number[] | null
}

export interface TrainerInput {
  fullName: string
  phoneNumber: string
  specialty: string | null
  payType: PayType
  payValue: number
  payCurrency: PayCurrency
}

export const trainersApi = {
  list: (params?: { search?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    api.get<Paged<TrainerDto>>('/trainers', params),
  create: (body: TrainerInput) => api.post<TrainerDto>('/trainers', body),
  update: (id: number, body: TrainerInput & { isActive: boolean }) => api.put<TrainerDto>('/trainers/' + id, body),
  remove: (id: number) => api.delete<unknown>('/trainers/' + id),
}