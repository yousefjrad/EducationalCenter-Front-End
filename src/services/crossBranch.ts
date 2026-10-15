import { api } from '@/services/api'

export interface BranchComparisonRow {
  branchId: number
  branchName: string
  branchCode: string
  isActive: boolean
  revenueSyp: number
  expensesSyp: number
  payrollSyp: number
  netProfitSyp: number
  studentCount: number
  newEnrollments: number
  attendanceRatePercent: number | null
  sectionFillRatePercent: number | null
  collectionRatePercent: number | null
  overdueSyp: number
  overdueInstallments: number
}

export interface BranchComparisonTotals {
  revenueSyp: number
  expensesSyp: number
  payrollSyp: number
  netProfitSyp: number
  studentCount: number
  newEnrollments: number
  overdueSyp: number
  overdueInstallments: number
}

export interface BranchComparisonReport {
  from: string
  to: string
  branches: BranchComparisonRow[]
  totals: BranchComparisonTotals
}

export const crossBranchApi = {
  comparison: (from: string, to: string) =>
    api.get<BranchComparisonReport>('/cross-branch/comparison', { from, to }),
}