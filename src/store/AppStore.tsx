import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type {
  AppState, Attendance, AttendanceStatus, AuditLog, Certificate, ClassSession, Course,
  Enrollment, Expense, Grade, ID, Installment, Payment, PaymentPlan, PermissionKey,
  Role, Section, SessionStatus, Student, Trainer, TrainerPayroll, User,
  CertificateTemplate, Settings,
} from '@/types'
import { buildSeedState } from '@/data/seed'
import { addDaysISO, todayISO, weekdayOf, nowISODateTime } from '@/lib/format'

import { useAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

const STORAGE_KEY = 'ecms-state-v1'

// ---------------------------------------------------------------------------
// Selectors (pure functions over state)
// ---------------------------------------------------------------------------

export const activeEnrollmentsOf = (s: AppState, sectionId: ID) =>
  s.enrollments.filter((e) => e.sectionId === sectionId && e.status === 'active')

export const enrollmentPaid = (s: AppState, enrollmentId: ID) =>
  s.payments.filter((p) => p.enrollmentId === enrollmentId && !p.voided).reduce((a, p) => a + p.amountSYP, 0)

export const planOf = (s: AppState, enrollmentId: ID) =>
  s.plans.find((p) => p.enrollmentId === enrollmentId)

export const installmentsOf = (s: AppState, enrollmentId: ID) => {
  const plan = planOf(s, enrollmentId)
  return plan ? s.installments.filter((i) => i.planId === plan.id) : []
}

export const enrollmentRemaining = (s: AppState, enrollmentId: ID) => {
  const plan = planOf(s, enrollmentId)
  if (!plan) return 0
  return Math.max(0, plan.totalAmount - enrollmentPaid(s, enrollmentId))
}

export const installmentPaid = (s: AppState, inst: Installment) =>
  s.payments.filter((p) => p.installmentId === inst.id && !p.voided).reduce((a, p) => a + p.amountSYP, 0)

export type InstStatus = 'paid' | 'partial' | 'pending' | 'overdue'
export const installmentStatus = (s: AppState, inst: Installment): InstStatus => {
  const paid = installmentPaid(s, inst)
  if (paid >= inst.amount) return 'paid'
  if (inst.dueDate < todayISO()) return 'overdue'
  return paid > 0 ? 'partial' : 'pending'
}

export const isSectionFull = (s: AppState, sectionId: ID) => {
  const sec = s.sections.find((x) => x.id === sectionId)
  if (!sec) return false
  return activeEnrollmentsOf(s, sectionId).length >= sec.capacity
}

export interface ConflictResult {
  roomConflict?: Section
  trainerConflict?: Section
  capacityIssue?: boolean
}

const overlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart < bEnd && bStart < aEnd

export function sectionConflicts(s: AppState, cand: Omit<Section, 'id'> & { id?: ID }): ConflictResult {
  const res: ConflictResult = {}
  const room = s.rooms.find((r) => r.id === cand.roomId)
  if (room && cand.capacity > room.capacity) res.capacityIssue = true
  for (const other of s.sections) {
    if (other.id === cand.id || other.status === 'cancelled') continue
    for (const a of cand.schedule) {
      for (const b of other.schedule) {
        if (a.day !== b.day) continue
        if (!overlap(a.start, a.end, b.start, b.end)) continue
        if (other.roomId === cand.roomId) res.roomConflict = other
        else if (other.trainerId === cand.trainerId) res.trainerConflict = other
      }
    }
  }
  return res
}

export function generateSessions(sec: Section, startId: number): ClassSession[] {
  const out: ClassSession[] = []
  const days = new Set(sec.schedule.map((x) => x.day))
  let cursor = sec.startDate
  let id = startId
  while (cursor <= sec.endDate) {
    if (days.has(weekdayOf(cursor))) {
      const slot = sec.schedule.find((x) => x.day === weekdayOf(cursor))!
      out.push({
        id: id++, sectionId: sec.id, date: cursor, start: slot.start, end: slot.end,
        status: cursor < todayISO() ? 'held' : 'scheduled',
      })
    }
    cursor = addDaysISO(cursor, 1)
  }
  return out
}

export const monthlyRevenue = (s: AppState, ym: string) =>
  s.payments.filter((p) => !p.voided && p.date.startsWith(ym)).reduce((a, p) => a + p.amountSYP, 0)

export const monthlyExpenses = (s: AppState, ym: string) =>
  s.expenses.filter((e) => e.date.startsWith(ym)).reduce((a, e) => a + e.amount, 0)

export const monthlyPayroll = (s: AppState, ym: string) =>
  s.payroll.filter((p) => p.month === ym).reduce((a, p) => a + p.amount, 0)

export interface OverdueItem {
  installment: Installment
  enrollment: Enrollment
  student: Student
  section: Section
  paid: number
}
export function overdueInstallments(s: AppState): OverdueItem[] {
  const out: OverdueItem[] = []
  for (const inst of s.installments) {
    if (installmentStatus(s, inst) !== 'overdue') continue
    const plan = s.plans.find((p) => p.id === inst.planId)!
    const enrollment = s.enrollments.find((e) => e.id === plan.enrollmentId)!
    if (enrollment.status !== 'active') continue
    const student = s.students.find((x) => x.id === enrollment.studentId)!
    const section = s.sections.find((x) => x.id === enrollment.sectionId)!
    out.push({ installment: inst, enrollment, student, section, paid: installmentPaid(s, inst) })
  }
  return out.sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate))
}

export interface AlertItem {
  key: string
  type: 'overdue' | 'waiting' | 'seat'
  text: { ar: string; en: string }
  link: string
  date: string
}
export function computedAlerts(s: AppState): AlertItem[] {
  const items: AlertItem[] = []
  for (const o of overdueInstallments(s)) {
    items.push({
      key: `overdue-${o.installment.id}`, type: 'overdue',
      text: {
        ar: `قسط متأخر: ${o.student.name} — ${o.section.title} (${o.installment.label})`,
        en: `Overdue installment: ${o.student.name} — ${o.section.title} (${o.installment.label})`,
      },
      link: '/payments', date: o.installment.dueDate,
    })
  }
  for (const w of s.waitingList.filter((x) => x.status === 'waiting')) {
    const st = s.students.find((x) => x.id === w.studentId)!
    const sec = s.sections.find((x) => x.id === w.sectionId)!
    items.push({
      key: `waiting-${w.id}`, type: 'waiting',
      text: {
        ar: `قائمة انتظار: ${st.name} بالدور ${w.position} — ${sec.title}`,
        en: `Waiting list: ${st.name} at position ${w.position} — ${sec.title}`,
      },
      link: '/students', date: w.date,
    })
  }
  return items.sort((a, b) => a.date.localeCompare(b.date))
}

export function can(_s: AppState, _userId: ID | null, perm: PermissionKey): boolean {
  return hasPermission(perm)
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'LOGIN'; userId: ID }
  | { type: 'LOGOUT' }
  | { type: 'SAVE_COURSE'; course: Course }
  | { type: 'SAVE_STUDENT'; student: Student }
  | { type: 'SAVE_TRAINER'; trainer: Trainer }
  | { type: 'SAVE_SECTION'; section: Section }
  | { type: 'SET_SECTION_STATUS'; id: ID; status: Section['status'] }
  | { type: 'SET_SESSION_STATUS'; id: ID; status: SessionStatus; note?: string; newDate?: string }
  | { type: 'ENROLL'; enrollment: Enrollment; plan?: { type: 'full' | 'installments'; installments: { amount: number; dueDate: string; label: string }[] } }
  | { type: 'WITHDRAW'; enrollmentId: ID }
  | { type: 'TRANSFER'; enrollmentId: ID; newSectionId: ID }
  | { type: 'PROMOTE_WAITING'; waitingId: ID; plan?: { installments: { amount: number; dueDate: string; label: string }[] } }
  | { type: 'CANCEL_WAITING'; waitingId: ID }
  | { type: 'RECORD_PAYMENT'; payment: Omit<Payment, 'id' | 'receiptNo' | 'date' | 'recordedBy' | 'voided' | 'method' | 'amountSYP'> & { amountSYP: number } }
  | { type: 'VOID_PAYMENT'; paymentId: ID; reason: string }
  | { type: 'SET_ATTENDANCE'; sessionId: ID; records: { studentId: ID; status: AttendanceStatus }[] }
  | { type: 'SAVE_GRADES'; sectionId: ID; grades: { studentId: ID; score: number }[] }
  | { type: 'ISSUE_CERT'; studentId: ID; sectionId: ID; override: boolean }
  | { type: 'SAVE_EXPENSE'; expense: Expense }
  | { type: 'DELETE_EXPENSE'; id: ID }
  | { type: 'SET_PAYROLL'; month: string; rows: Omit<TrainerPayroll, 'id'>[] }
  | { type: 'MARK_PAYROLL_PAID'; id: ID }
  | { type: 'SAVE_USER'; user: User }
  | { type: 'SAVE_ROLE'; role: Role }
  | { type: 'DELETE_ROLE'; id: ID }
  | { type: 'DISMISS_ALERT'; key: string }
  | { type: 'SAVE_SETTINGS'; settings: Settings }
  | { type: 'SAVE_TEMPLATE'; template: CertificateTemplate }
  | { type: 'RESET' }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const nextId = (s: AppState, key: string): [number, AppState['seq']] => {
  const id = s.seq[key]
  return [id, { ...s.seq, [key]: id + 1 }]
}

function audit(s: AppState, entry: Omit<AuditLog, 'id' | 'date' | 'userId'> & { userId?: ID }): { log: AuditLog; seq: AppState['seq'] } {
  const [id, seq] = nextId(s, 'audit')
  return {
    log: { id, userId: entry.userId ?? s.currentUserId ?? 1, action: entry.action, entity: entry.entity, entityId: entry.entityId, details: entry.details, date: nowISODateTime() },
    seq,
  }
}

function reposition(s: AppState['waitingList'], sectionId: ID): AppState['waitingList'] {
  let pos = 1
  return s.map((w) =>
    w.sectionId === sectionId && w.status === 'waiting' ? { ...w, position: pos++ } : w,
  )
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUserId: action.userId }
    case 'LOGOUT':
      return { ...state, currentUserId: null }

    case 'SAVE_COURSE': {
      const exists = state.courses.some((c) => c.id === action.course.id)
      if (exists)
        return { ...state, courses: state.courses.map((c) => (c.id === action.course.id ? action.course : c)) }
      const [id, seq] = nextId(state, 'course')
      return { ...state, seq, courses: [...state.courses, { ...action.course, id }] }
    }

    case 'SAVE_STUDENT': {
      const exists = state.students.some((x) => x.id === action.student.id)
      if (exists)
        return { ...state, students: state.students.map((x) => (x.id === action.student.id ? action.student : x)) }
      const [id, seq] = nextId(state, 'student')
      return { ...state, seq, students: [...state.students, { ...action.student, id }] }
    }

    case 'SAVE_TRAINER': {
      const exists = state.trainers.some((x) => x.id === action.trainer.id)
      if (exists)
        return { ...state, trainers: state.trainers.map((x) => (x.id === action.trainer.id ? action.trainer : x)) }
      const [id, seq] = nextId(state, 'trainer')
      return { ...state, seq, trainers: [...state.trainers, { ...action.trainer, id }] }
    }

    case 'SAVE_SECTION': {
      const exists = state.sections.some((x) => x.id === action.section.id)
      if (exists) {
        const old = state.sections.find((x) => x.id === action.section.id)!
        const scheduleChanged = JSON.stringify(old.schedule) !== JSON.stringify(action.section.schedule)
        const sessions = scheduleChanged
          ? [
              ...state.sessions.filter((x) => x.sectionId !== old.id || x.status !== 'scheduled'),
              ...generateSessions(action.section, state.seq.session).filter((x) => x.status === 'scheduled'),
            ]
          : state.sessions
        return {
          ...state,
          sections: state.sections.map((x) => (x.id === action.section.id ? action.section : x)),
          sessions,
        }
      }
      const [id, seq1] = nextId(state, 'section')
      const section = { ...action.section, id }
      const sessions = generateSessions(section, seq1.session)
      const seq = { ...seq1, session: seq1.session + sessions.length }
      return { ...state, seq, sections: [...state.sections, section], sessions: [...state.sessions, ...sessions] }
    }

    case 'SET_SECTION_STATUS':
      return { ...state, sections: state.sections.map((x) => (x.id === action.id ? { ...x, status: action.status } : x)) }

    case 'SET_SESSION_STATUS':
      return {
        ...state,
        sessions: state.sessions.map((x) =>
          x.id === action.id
            ? { ...x, status: action.status, note: action.note, date: action.newDate ?? x.date }
            : x,
        ),
      }

    case 'ENROLL': {
      const sec = state.sections.find((x) => x.id === action.enrollment.sectionId)
      if (!sec) return state
      // full → waiting list
      if (isSectionFull(state, sec.id)) {
        const [wid, seq] = nextId(state, 'waiting')
        const position = state.waitingList.filter((w) => w.sectionId === sec.id && w.status === 'waiting').length + 1
        const entry = { id: wid, studentId: action.enrollment.studentId, sectionId: sec.id, position, date: todayISO(), status: 'waiting' as const }
        return { ...state, seq, waitingList: [...state.waitingList, entry] }
      }
      const [eid, seq1] = nextId(state, 'enrollment')
      const enrollment: Enrollment = { ...action.enrollment, id: eid, date: todayISO(), status: 'active' }
      let s: AppState = { ...state, seq: seq1, enrollments: [...state.enrollments, enrollment] }
      if (action.plan) {
        const [pid, seq2] = nextId(s, 'plan')
        const plan: PaymentPlan = { id: pid, enrollmentId: eid, type: action.plan.type, totalAmount: sec.price }
        const newInstallments: Installment[] = []
        let seq3 = seq2
        for (const inst of action.plan.installments) {
          const [iid, nseq] = nextId({ ...s, seq: seq3 }, 'installment')
          seq3 = nseq
          newInstallments.push({ id: iid, planId: pid, amount: inst.amount, dueDate: inst.dueDate, label: inst.label })
        }
        s = { ...s, seq: seq3, plans: [...s.plans, plan], installments: [...s.installments, ...newInstallments] }
      }
      return s
    }

    case 'WITHDRAW':
      return {
        ...state,
        enrollments: state.enrollments.map((e) => (e.id === action.enrollmentId ? { ...e, status: 'withdrawn' } : e)),
      }

    case 'TRANSFER': {
      const old = state.enrollments.find((e) => e.id === action.enrollmentId)
      const newSec = state.sections.find((x) => x.id === action.newSectionId)
      if (!old || !newSec || isSectionFull(state, newSec.id)) return state
      const [eid, seq1] = nextId(state, 'enrollment')
      const newEnroll: Enrollment = { id: eid, studentId: old.studentId, sectionId: newSec.id, status: 'active', date: todayISO() }
      const [pid, seq2] = nextId({ ...state, seq: seq1 }, 'plan')
      const plan: PaymentPlan = { id: pid, enrollmentId: eid, type: 'full', totalAmount: newSec.price }
      return {
        ...state,
        seq: seq2,
        enrollments: [
          ...state.enrollments.map((e) => (e.id === old.id ? { ...e, status: 'transferred' as const, transferredToId: eid } : e)),
          newEnroll,
        ],
        // payments move with the student to the new enrollment
        payments: state.payments.map((p) => (p.enrollmentId === old.id ? { ...p, enrollmentId: eid, installmentId: undefined } : p)),
        plans: [...state.plans, plan],
      }
    }

    case 'PROMOTE_WAITING': {
      const w = state.waitingList.find((x) => x.id === action.waitingId)
      if (!w || isSectionFull(state, w.sectionId)) return state
      const sec = state.sections.find((x) => x.id === w.sectionId)!
      const [eid, seq1] = nextId(state, 'enrollment')
      const enrollment: Enrollment = { id: eid, studentId: w.studentId, sectionId: w.sectionId, status: 'active', date: todayISO() }
      let s: AppState = {
        ...state, seq: seq1,
        enrollments: [...state.enrollments, enrollment],
        waitingList: reposition(state.waitingList.map((x) => (x.id === w.id ? { ...x, status: 'promoted' as const } : x)), w.sectionId),
      }
      const insts = action.plan?.installments ?? [{ amount: sec.price, dueDate: todayISO(), label: 'دفعة كاملة' }]
      const [pid, seq2] = nextId(s, 'plan')
      const plan: PaymentPlan = { id: pid, enrollmentId: eid, type: action.plan ? 'installments' : 'full', totalAmount: sec.price }
      let seq3 = seq2
      const newInstallments: Installment[] = []
      for (const inst of insts) {
        const [iid, nseq] = nextId({ ...s, seq: seq3 }, 'installment')
        seq3 = nseq
        newInstallments.push({ id: iid, planId: pid, amount: inst.amount, dueDate: inst.dueDate, label: inst.label })
      }
      return { ...s, seq: seq3, plans: [...s.plans, plan], installments: [...s.installments, ...newInstallments] }
    }

    case 'CANCEL_WAITING': {
      const w = state.waitingList.find((x) => x.id === action.waitingId)
      if (!w) return state
      return {
        ...state,
        waitingList: reposition(state.waitingList.map((x) => (x.id === w.id ? { ...x, status: 'cancelled' as const } : x)), w.sectionId),
      }
    }

    case 'RECORD_PAYMENT': {
      const [pid, seq1] = nextId(state, 'payment')
      const receiptNo = `R-${seq1.receipt}`
      const seq2 = { ...seq1, receipt: seq1.receipt + 1 }
      const payment: Payment = {
        ...action.payment, id: pid, receiptNo, method: 'cash',
        date: nowISODateTime(), recordedBy: state.currentUserId ?? 1, voided: false,
      }
      const { log, seq } = audit({ ...state, seq: seq2 }, {
        action: 'create', entity: 'Payment', entityId: pid,
        details: `تسجيل دفعة ${payment.amountSYP.toLocaleString('en-US')} ل.س — إيصال ${receiptNo}`,
      })
      return { ...state, seq, payments: [...state.payments, payment], auditLog: [...state.auditLog, log] }
    }

    case 'VOID_PAYMENT': {
      const p = state.payments.find((x) => x.id === action.paymentId)
      if (!p) return state
      const { log, seq } = audit(state, {
        action: 'void', entity: 'Payment', entityId: p.id,
        details: `إبطال الدفعة ${p.receiptNo} — ${action.reason}`,
      })
      return {
        ...state, seq,
        payments: state.payments.map((x) => (x.id === p.id ? { ...x, voided: true, voidReason: action.reason } : x)),
        auditLog: [...state.auditLog, log],
      }
    }

    case 'SET_ATTENDANCE': {
      const rest = state.attendance.filter((a) => a.sessionId !== action.sessionId)
      let seq = state.seq
      const records: Attendance[] = []
      for (const r of action.records) {
        const existing = state.attendance.find((a) => a.sessionId === action.sessionId && a.studentId === r.studentId)
        if (existing) records.push({ ...existing, status: r.status })
        else {
          const [id, nseq] = nextId({ ...state, seq }, 'attendance')
          seq = nseq
          records.push({ id, sessionId: action.sessionId, studentId: r.studentId, status: r.status })
        }
      }
      // also mark the session as held when attendance is taken
      const sessions = state.sessions.map((x) =>
        x.id === action.sessionId && x.status === 'scheduled' ? { ...x, status: 'held' as const } : x,
      )
      return { ...state, seq, attendance: [...rest, ...records], sessions }
    }

    case 'SAVE_GRADES': {
      let seq = state.seq
      const others = state.grades.filter((g) => g.sectionId !== action.sectionId)
      const kept = state.grades.filter((g) => g.sectionId === action.sectionId)
      const out: Grade[] = []
      for (const g of action.grades) {
        const existing = kept.find((k) => k.studentId === g.studentId)
        if (existing) out.push({ ...existing, score: g.score })
        else {
          const [id, nseq] = nextId({ ...state, seq }, 'grade')
          seq = nseq
          out.push({ id, studentId: g.studentId, sectionId: action.sectionId, score: g.score, maxScore: 100 })
        }
      }
      return { ...state, seq, grades: [...others, ...out] }
    }

    case 'ISSUE_CERT': {
      const [cid, seq1] = nextId(state, 'certificate')
      const serial = `CERT-${new Date().getFullYear()}-${String(seq1.certSerial).padStart(3, '0')}`
      const seq2 = { ...seq1, certSerial: seq1.certSerial + 1 }
      const cert: Certificate = {
        id: cid, serial, studentId: action.studentId, sectionId: action.sectionId,
        issueDate: todayISO(), override: action.override, issuedBy: state.currentUserId ?? 1,
      }
      const { log, seq } = audit({ ...state, seq: seq2 }, {
        action: 'create', entity: 'Certificate', entityId: cid,
        details: `إصدار شهادة ${serial}${action.override ? ' (استثناء إداري)' : ''}`,
      })
      return { ...state, seq, certificates: [...state.certificates, cert], auditLog: [...state.auditLog, log] }
    }

    case 'SAVE_EXPENSE': {
      const exists = state.expenses.some((x) => x.id === action.expense.id)
      if (exists) {
        const { log, seq } = audit(state, { action: 'update', entity: 'Expense', entityId: action.expense.id, details: `تعديل مصروف: ${action.expense.title}` })
        return { ...state, seq, expenses: state.expenses.map((x) => (x.id === action.expense.id ? action.expense : x)), auditLog: [...state.auditLog, log] }
      }
      const [id, seq1] = nextId(state, 'expense')
      const { log, seq } = audit({ ...state, seq: seq1 }, { action: 'create', entity: 'Expense', entityId: id, details: `إضافة مصروف: ${action.expense.title} بقيمة ${action.expense.amount.toLocaleString('en-US')} ل.س` })
      return { ...state, seq, expenses: [...state.expenses, { ...action.expense, id }], auditLog: [...state.auditLog, log] }
    }

    case 'DELETE_EXPENSE': {
      const x = state.expenses.find((e) => e.id === action.id)
      const { log, seq } = audit(state, { action: 'void', entity: 'Expense', entityId: action.id, details: `حذف مصروف: ${x?.title ?? action.id}` })
      return { ...state, seq, expenses: state.expenses.filter((e) => e.id !== action.id), auditLog: [...state.auditLog, log] }
    }

    case 'SET_PAYROLL': {
      let seq = state.seq
      const others = state.payroll.filter((p) => p.month !== action.month)
      const rows: TrainerPayroll[] = action.rows.map((r) => {
        const [id, nseq] = nextId({ ...state, seq }, 'payroll')
        seq = nseq
        return { ...r, id }
      })
      const { log, seq: seq2 } = audit({ ...state, seq }, { action: 'create', entity: 'TrainerPayroll', entityId: rows[0]?.id ?? 0, details: `احتساب رواتب شهر ${action.month} (${rows.length} مدرباً)` })
      return { ...state, seq: seq2, payroll: [...others, ...rows], auditLog: [...state.auditLog, log] }
    }

    case 'MARK_PAYROLL_PAID': {
      const p = state.payroll.find((x) => x.id === action.id)
      if (!p) return state
      const { log, seq } = audit(state, { action: 'update', entity: 'TrainerPayroll', entityId: p.id, details: `صرف راتب شهر ${p.month} — ${p.amount.toLocaleString('en-US')} ل.س` })
      return {
        ...state, seq,
        payroll: state.payroll.map((x) => (x.id === p.id ? { ...x, status: 'paid' as const, paidAt: todayISO() } : x)),
        auditLog: [...state.auditLog, log],
      }
    }

    case 'SAVE_USER': {
      const exists = state.users.some((x) => x.id === action.user.id)
      if (exists)
        return { ...state, users: state.users.map((x) => (x.id === action.user.id ? action.user : x)) }
      const [id, seq] = nextId(state, 'user')
      return { ...state, seq, users: [...state.users, { ...action.user, id }] }
    }

    case 'SAVE_ROLE': {
      const exists = state.roles.some((x) => x.id === action.role.id)
      if (exists)
        return { ...state, roles: state.roles.map((x) => (x.id === action.role.id ? action.role : x)) }
      const [id, seq] = nextId(state, 'role')
      return { ...state, seq, roles: [...state.roles, { ...action.role, id }] }
    }

    case 'DELETE_ROLE':
      return { ...state, roles: state.roles.filter((r) => r.id !== action.id) }

    case 'DISMISS_ALERT':
      return { ...state, dismissedAlerts: [...state.dismissedAlerts, action.key] }

    case 'SAVE_SETTINGS':
      return { ...state, settings: action.settings }

    case 'SAVE_TEMPLATE':
      return { ...state, certTemplate: action.template }

    case 'RESET':
      return buildSeedState()

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Provider & hooks
// ---------------------------------------------------------------------------

interface StoreCtx {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<StoreCtx | null>(null)

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && parsed.settings && parsed.sections) return parsed
    }
  } catch {
    // corrupted state → fall back to seed
  }
  return buildSeedState()
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full / unavailable — app keeps working in memory
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreCtx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within AppStoreProvider')
  return ctx
}

export function useCurrentUser(): User | null {
  const { user } = useAuth()
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email, password: '', roleId: 0, active: true, createdAt: '' }
}

export function useCan(perm: PermissionKey): boolean {
  useAuth()
  return hasPermission(perm)
}
