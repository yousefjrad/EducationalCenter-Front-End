import { api } from '@/services/api'
import type { Paged } from '@/services/common'

export type BudgetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected'

export interface BudgetDto {
  id: number
  branchId: number
  branchName: string
  month: string
  requestedAmountSyp: number
  approvedAmountSyp: number | null
  status: BudgetStatus
  notes: string | null
  requestedByUserId: number
  requestedByName: string
  decidedAt: string | null
  spentSyp: number
  remainingSyp: number | null
}

export const budgetsApi = {
  list: (params?: { status?: BudgetStatus; branchId?: number; page?: number; pageSize?: number }) =>
    api.get<Paged<BudgetDto>>('/budgets', params),
  create: (body: { month: string; requestedAmountSyp: number; notes: string | null }) =>
    api.post<BudgetDto>('/budgets', body),
  update: (id: number, body: { requestedAmountSyp: number; notes: string | null }) =>
    api.put<BudgetDto>('/budgets/' + id, body),
  submit: (id: number) => api.post<BudgetDto>('/budgets/' + id + '/submit'),
  approve: (id: number, approvedAmountSyp: number | null) =>
    api.post<BudgetDto>('/budgets/' + id + '/approve', { approvedAmountSyp }),
  reject: (id: number, reason: string) => api.post<BudgetDto>('/budgets/' + id + '/reject', { reason }),
}