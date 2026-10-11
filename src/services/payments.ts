import { api, getAccessToken } from './api'

export type Currency = 'Syp' | 'Usd'
export type PaymentStatus = 'Valid' | 'Cancelled'
export type InstallmentStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Overdue'
export type PlanStatus = 'Open' | 'FullyPaid' | 'Cancelled'

export interface PaymentDto {
  id: number
  installmentId: number
  installmentNumber: number
  enrollmentId: number
  studentName: string
  sectionName: string
  currency: Currency
  amountPaid: number
  exchangeRate: number | null
  amountInSyp: number
  paidAt: string
  receivedByUserId: number
  status: PaymentStatus
  cancelReason: string | null
  receiptId: number | null
  receiptNumber: string | null
}

export interface InstallmentDto {
  id: number
  number: number
  amount: number
  dueDate: string
  paidAmountInSyp: number
  remainingInSyp: number
  status: InstallmentStatus
}

export interface PaymentPlanDto {
  id: number
  enrollmentId: number
  studentId: number
  studentName: string
  sectionName: string
  totalAmount: number
  installmentsCount: number
  paidAmountInSyp: number
  remainingInSyp: number
  status: PlanStatus
  installments: InstallmentDto[]
}

export interface PaymentsPage {
  items: PaymentDto[]
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

export const paymentsApi = {
  list: (q: { status?: PaymentStatus | ''; from?: string; to?: string; page?: number; pageSize?: number }) =>
    api.get(`/payments?${qs(q)}`) as Promise<PaymentsPage>,
  record: (body: { installmentId: number; currency: Currency; amountPaid: number; exchangeRate: number | null }) =>
    api.post('/payments', body) as Promise<PaymentDto>,
  cancel: (id: number, reason: string) => api.post(`/payments/${id}/cancel`, { reason }) as Promise<PaymentDto>,
}

export const plansApi = {
  get: (enrollmentId: number) => api.get(`/payment-plans/enrollments/${enrollmentId}`) as Promise<PaymentPlanDto>,
  create: (body: { enrollmentId: number; installmentsCount: number; firstDueDate: string }) =>
    api.post('/payment-plans', body) as Promise<PaymentPlanDto>,
}

/** Downloads the receipt PDF with the access token and opens it in a new tab. */
export async function openReceiptPdf(receiptId: number, language: 'ar' | 'en' = 'ar') {
  const base = import.meta.env.VITE_API_BASE_URL as string
  const res = await fetch(`${base}/receipts/${receiptId}/pdf?language=${language}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  if (!res.ok) throw new Error(String(res.status))
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}