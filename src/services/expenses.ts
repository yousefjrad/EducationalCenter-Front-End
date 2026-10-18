import { api } from './api'

export type Currency = 'Syp' | 'Usd'
export type PayrollStatus = 'Due' | 'Paid' | 'Cancelled'
export type PayType = 'Monthly' | 'Hourly' | 'Percentage'

export interface ExpenseDto {
  id: number
  category: string
  description: string
  currency: Currency
  amount: number
  exchangeRate: number | null
  amountInSyp: number
  expenseDate: string
  recordedByUserId: number
  branchId?: number
}

export interface ExpenseBody {
  category: string
  description: string
  currency: Currency
  amount: number
  exchangeRate: number | null
  expenseDate: string
}

export interface PayrollDto {
  id: number
  trainerId: number
  trainerName: string
  periodStart: string
  periodEnd: string
  calculationMethod: string
  currency: Currency
  amount: number
  exchangeRate: number | null
  amountInSyp: number
  status: PayrollStatus
  paidAt: string | null
  paidByUserId: number | null
  branchId?: number
}

export interface PayrollCalcDto {
  trainerId: number
  trainerName: string
  payType: PayType
  payValue: number
  currency: Currency
  periodStart: string
  periodEnd: string
  amount: number
  exchangeRate: number | null
  amountInSyp: number
  calculationMethod: string
  monthsCovered: number | null
  hoursWorked: number | null
  revenueCollectedInSyp: number | null
}

export interface PageOf<T> {
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

export const expensesApi = {
  list: (q: { category?: string; from?: string; to?: string; page?: number; pageSize?: number }) =>
    api.get(`/expenses?${qs(q)}`) as Promise<PageOf<ExpenseDto>>,
  categories: () => api.get('/expenses/categories') as Promise<string[]>,
  create: (b: ExpenseBody) => api.post('/expenses', b) as Promise<ExpenseDto>,
  update: (id: number, b: ExpenseBody) => api.put(`/expenses/${id}`, b) as Promise<ExpenseDto>,
}

export interface PayrollRequest {
  trainerId: number
  periodStart: string
  periodEnd: string
  exchangeRate: number | null
}

export const payrollApi = {
  list: (q: { trainerId?: number; status?: PayrollStatus | ''; page?: number; pageSize?: number }) =>
    api.get(`/trainer-payrolls?${qs(q)}`) as Promise<PageOf<PayrollDto>>,
  calculate: (b: PayrollRequest) => api.post('/trainer-payrolls/calculate', b) as Promise<PayrollCalcDto>,
  create: (b: PayrollRequest) => api.post('/trainer-payrolls', b) as Promise<PayrollDto>,
  pay: (id: number, exchangeRate: number | null) =>
    api.post(`/trainer-payrolls/${id}/pay`, { exchangeRate }) as Promise<PayrollDto>,
  cancel: (id: number, reason: string) =>
    api.post(`/trainer-payrolls/${id}/cancel`, { reason }) as Promise<PayrollDto>,
}