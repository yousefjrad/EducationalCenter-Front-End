import { api } from '@/services/api'

export interface BranchDto {
  id: number
  name: string
  code: string
  governorate: string | null
  address: string | null
  phone: string | null
  isActive: boolean
}

export const branchesApi = {
  list: async (): Promise<BranchDto[]> => {
    const r = await api.get<BranchDto[] | { items: BranchDto[] }>('/branches')
    return Array.isArray(r) ? r : r.items
  },
}