import { api, getAccessToken } from './api'

export interface MonthlyRevenueRow {
  year: number
  month: number
  paymentsCount: number
  totalInSyp: number
  receivedInSyp: number
  receivedInUsd: number
  usdValueInSyp: number
}
export interface MonthlyRevenueReport {
  from: string
  to: string
  rows: MonthlyRevenueRow[]
  totalPayments: number
  totalInSyp: number
}
export interface StudentBalanceRow {
  enrollmentId: number
  studentId: number
  studentName: string
  phoneNumber: string
  sectionId: number
  sectionName: string
  courseName: string
  agreedPrice: number
  paidInSyp: number
  remainingInSyp: number
}
export interface StudentBalancesReport {
  rows: StudentBalanceRow[]
  totalRemainingInSyp: number
}
export interface OverdueRow {
  installmentId: number
  enrollmentId: number
  studentId: number
  studentName: string
  phoneNumber: string
  sectionName: string
  installmentNumber: number
  dueDate: string
  daysOverdue: number
  amount: number
  paidInSyp: number
  remainingInSyp: number
}
export interface OverdueReport {
  asOf: string
  rows: OverdueRow[]
  totalRemainingInSyp: number
}
export interface NetProfitReport {
  from: string
  to: string
  revenueInSyp: number
  expensesInSyp: number
  trainerPayrollInSyp: number
  netProfitInSyp: number
  expensesByCategory: { category: string; totalInSyp: number }[]
}
export interface OccupancyRow {
  sectionId: number
  sectionName: string
  courseName: string
  trainerName: string
  roomName: string
  status: string
  capacity: number
  seatsTaken: number
  waitingCount: number
  vacantSeats: number
}
export interface OccupancyReport {
  rows: OccupancyRow[]
  totalCapacity: number
  totalSeatsTaken: number
  totalVacantSeats: number
  totalWaiting: number
}
export interface ScheduleRow {
  sessionId: number
  date: string
  startTime: string
  endTime: string
  courseName: string
  sectionName: string
  roomName: string
  trainerName: string
  status: string
}
export interface ScheduleReport {
  ownerName: string
  from: string
  to: string
  rows: ScheduleRow[]
}

export const qs = (q: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams()
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, String(v))
  })
  return p.toString()
}

/** Download a report file (Excel / PDF) with the bearer token. */
export async function downloadReport(path: string, fallbackName: string) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  if (!res.ok) {
    let msg = ''
    try {
      const j = await res.json()
      msg = j.detail || j.title || j.message || ''
    } catch {
      /* not json */
    }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const cd = res.headers.get('content-disposition') || ''
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)
  let name = fallbackName
  if (m) {
    try {
      name = decodeURIComponent(m[1])
    } catch {
      name = m[1]
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export const reportsApi = {
  get: <T,>(path: string) => api.get(path) as Promise<T>,
}