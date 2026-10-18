import type { PermissionKey } from '@/types'

// Frontend permission key -> backend permission name(s). null = any signed-in user.
const MAP: Record<PermissionKey, string[] | null> = {
  'Dashboard.View': null,
  'Courses.View': ['Courses.View'],
  'Courses.Manage': ['Courses.Create'],
  'Sections.View': ['Sections.View'],
  'Sections.Manage': ['Sections.Create'],
  'Students.View': ['Students.View'],
  'Students.Manage': ['Students.Create'],
  'Enrollments.Manage': ['Enrollments.Create'],
  'Trainers.View': ['Trainers.View'],
  'Trainers.Manage': ['Trainers.Create'],
  'Payments.View': ['Payments.View'],
  'Payments.Create': ['Payments.Create'],
  'Payments.Void': ['Payments.Cancel'],
  'Attendance.Manage': ['Attendance.Record'],
  'Grades.Manage': ['Grades.Record'],
  'Certificates.Issue': ['Certificates.Issue'],
  'Certificates.Override': ['Certificates.Override'],
  'Expenses.Manage': ['Expenses.Create'],
  'Payroll.Manage': ['TrainerPayroll.Calculate'],
  'Reports.View': ['Reports.Operational', 'Reports.Financial'],
  'Users.Manage': ['Users.Create'],
  'Audit.View': ['AuditLog.View'],
  'Settings.Manage': ['Settings.Update'],
  'Branches.View': ['Branches.View'],
  'Branches.Manage': ['Branches.Manage'],
  'Budgets.View': ['Budgets.View'],
  'Budgets.Request': ['Budgets.Request'],
  'Budgets.Approve': ['Budgets.Approve'],
  'Reports.CrossBranch': ['Reports.CrossBranch'],
  'Students.Transfer': ['Students.Transfer'],
  'Courses.Delete': ['Courses.Delete'],
  'Trainers.Delete': ['Trainers.Delete'],
  'Students.Delete': ['Students.Delete'],
}

let active = new Set<string>()

export function setActivePermissions(list: string[]) {
  active = new Set(list)
}

export function hasPermission(key: PermissionKey): boolean {
  const need = MAP[key]
  if (need === null) return true
  if (!need) return false
  return need.some((p) => active.has(p))
}