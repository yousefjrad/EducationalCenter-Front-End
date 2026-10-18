// ---------------------------------------------------------------------------
// Domain entities — Educational Center Management System
// Mirrors the backend domain model (Course/Section/Room/Trainer/ClassSession,
// Student/Enrollment/..., Payment/Installment/..., User/Role/Permission).
// ---------------------------------------------------------------------------

export type ID = number

export type PermissionKey =
  | 'Dashboard.View'
  | 'Courses.View' | 'Courses.Manage'
  | 'Sections.View' | 'Sections.Manage'
  | 'Students.View' | 'Students.Manage'
  | 'Enrollments.Manage'
  | 'Trainers.View' | 'Trainers.Manage'
  | 'Payments.View' | 'Payments.Create' | 'Payments.Void'
  | 'Attendance.Manage'
  | 'Grades.Manage'
  | 'Certificates.Issue' | 'Certificates.Override'
  | 'Expenses.Manage'
  | 'Payroll.Manage'
  | 'Reports.View'
  | 'Users.Manage'
  | 'Audit.View'
  | 'Settings.Manage'
  | 'Branches.View' | 'Branches.Manage'
  | 'Budgets.View' | 'Budgets.Request' | 'Budgets.Approve'
  | 'Reports.CrossBranch' | 'Students.Transfer'
  | 'Courses.Delete' | 'Trainers.Delete' | 'Students.Delete'

export interface Role {
  id: ID
  name: string
  nameEn: string
  builtin?: boolean
  permissions: PermissionKey[]
}

export interface User {
  id: ID
  name: string
  email: string
  password: string // mock only — never do this in production
  roleId: ID
  active: boolean
  createdAt: string
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all'

export interface Course {
  id: ID
  name: string
  nameEn: string
  description: string
  level: CourseLevel
  active: boolean
}

export interface Room {
  id: ID
  name: string
  capacity: number
  active: boolean
}

export type PayrollType = 'fixed' | 'hourly' | 'percentage'

export interface Trainer {
  id: ID
  name: string
  phone: string
  specialty: string
  payrollType: PayrollType
  fixedSalary?: number   // SYP / month
  hourlyRate?: number    // SYP / hour
  percentage?: number    // % of section revenue
  active: boolean
}

/** weekly recurring slot, day: 0 = Sunday … 6 = Saturday */
export interface WeeklySlot {
  day: number
  start: string // 'HH:MM'
  end: string   // 'HH:MM'
}

export type SectionStatus = 'open' | 'completed' | 'cancelled'

export interface Section {
  id: ID
  courseId: ID
  trainerId: ID
  roomId: ID
  title: string
  price: number          // SYP
  capacity: number
  schedule: WeeklySlot[]
  startDate: string      // ISO date
  endDate: string        // ISO date
  status: SectionStatus
}

export type SessionStatus = 'scheduled' | 'held' | 'cancelled' | 'postponed'

export interface ClassSession {
  id: ID
  sectionId: ID
  date: string           // ISO date
  start: string
  end: string
  status: SessionStatus
  note?: string
}

export interface Student {
  id: ID
  name: string
  phone: string
  createdAt: string
  active: boolean
}

export type EnrollmentStatus = 'active' | 'withdrawn' | 'transferred'

export interface Enrollment {
  id: ID
  studentId: ID
  sectionId: ID
  status: EnrollmentStatus
  date: string
  transferredToId?: ID
}

export interface WaitingListEntry {
  id: ID
  studentId: ID
  sectionId: ID
  position: number
  date: string
  status: 'waiting' | 'promoted' | 'cancelled'
}

export type AttendanceStatus = 'present' | 'absent'

export interface Attendance {
  id: ID
  sessionId: ID
  studentId: ID
  status: AttendanceStatus
}

export interface Grade {
  id: ID
  studentId: ID
  sectionId: ID
  score: number
  maxScore: number
}

export interface Certificate {
  id: ID
  serial: string
  studentId: ID
  sectionId: ID
  issueDate: string
  override?: boolean
  issuedBy: ID
}

export interface PaymentPlan {
  id: ID
  enrollmentId: ID
  type: 'full' | 'installments'
  totalAmount: number // SYP
}

export type InstallmentStatus = 'pending' | 'partial' | 'paid' | 'overdue'

export interface Installment {
  id: ID
  planId: ID
  amount: number   // SYP
  dueDate: string
  label: string
}

export type Currency = 'SYP' | 'USD'

export interface Payment {
  id: ID
  receiptNo: string
  enrollmentId: ID
  installmentId?: ID
  amount: number        // in `currency`
  currency: Currency
  exchangeRate?: number // SYP per 1 USD, required when currency = USD
  amountSYP: number     // SYP equivalent, stored at payment time
  method: 'cash'
  date: string          // ISO datetime
  recordedBy: ID
  voided: boolean
  voidReason?: string
}

export interface Expense {
  id: ID
  title: string
  category: 'rent' | 'utilities' | 'supplies' | 'maintenance' | 'other'
  amount: number // SYP
  date: string
  notes?: string
}

export interface TrainerPayroll {
  id: ID
  trainerId: ID
  month: string // 'YYYY-MM'
  amount: number
  details: string
  status: 'due' | 'paid'
  paidAt?: string
}

export interface AuditLog {
  id: ID
  userId: ID
  action: 'create' | 'update' | 'void'
  entity: 'Payment' | 'Expense' | 'TrainerPayroll' | 'Certificate'
  entityId: ID
  details: string
  date: string
}

export interface CertificateTemplate {
  centerName: string
  logoText: string
  signatureName: string
  bodyText: string
}

export interface Settings {
  centerName: string
  passMark: number          // minimum passing score (out of 100)
  defaultExchangeRate: number
  autoBackup: boolean
  backupIntervalDays: number
  seatHoldHours: number     // online-registration temporary hold (future)
  language: 'ar' | 'en'
}

export interface AppState {
  seq: Record<string, number>
  currentUserId: ID | null
  roles: Role[]
  users: User[]
  courses: Course[]
  rooms: Room[]
  trainers: Trainer[]
  sections: Section[]
  sessions: ClassSession[]
  students: Student[]
  enrollments: Enrollment[]
  waitingList: WaitingListEntry[]
  attendance: Attendance[]
  grades: Grade[]
  certificates: Certificate[]
  plans: PaymentPlan[]
  installments: Installment[]
  payments: Payment[]
  expenses: Expense[]
  payroll: TrainerPayroll[]
  auditLog: AuditLog[]
  dismissedAlerts: string[]
  certTemplate: CertificateTemplate
  settings: Settings
}
