import type {
  AppState, ClassSession, Course, Enrollment, Expense, Grade, Installment,
  Payment, PaymentPlan, Role, Room, Section, Student, Trainer, TrainerPayroll,
  User, WaitingListEntry, Attendance, AuditLog, Certificate, PermissionKey,
} from '@/types'
import { addDaysISO, todayISO, weekdayOf, nowISODateTime, monthKey } from '@/lib/format'

export const ALL_PERMISSIONS: PermissionKey[] = [
  'Dashboard.View',
  'Courses.View', 'Courses.Manage',
  'Sections.View', 'Sections.Manage',
  'Students.View', 'Students.Manage', 'Enrollments.Manage',
  'Trainers.View', 'Trainers.Manage',
  'Payments.View', 'Payments.Create', 'Payments.Void',
  'Attendance.Manage', 'Grades.Manage',
  'Certificates.Issue', 'Certificates.Override',
  'Expenses.Manage', 'Payroll.Manage',
  'Reports.View', 'Users.Manage', 'Audit.View', 'Settings.Manage',
]

const RECEPTIONIST_PERMS: PermissionKey[] = [
  'Dashboard.View', 'Courses.View', 'Sections.View', 'Sections.Manage',
  'Students.View', 'Students.Manage', 'Enrollments.Manage', 'Trainers.View',
  'Payments.View', 'Payments.Create', 'Attendance.Manage', 'Grades.Manage',
  'Certificates.Issue', 'Reports.View',
]

// ---------------------------------------------------------------------------

export function buildSeedState(): AppState {
  const T = todayISO()
  const d = (n: number) => addDaysISO(T, n)

  const roles: Role[] = [
    { id: 1, name: 'مدير النظام', nameEn: 'Admin', builtin: true, permissions: [...ALL_PERMISSIONS] },
    { id: 2, name: 'موظف استقبال', nameEn: 'Receptionist', builtin: true, permissions: [...RECEPTIONIST_PERMS] },
  ]

  const users: User[] = [
    { id: 1, name: 'سامر حداد', email: 'admin@markazi.com', password: 'admin123', roleId: 1, active: true, createdAt: d(-120) },
    { id: 2, name: 'ليلى عثمان', email: 'reception@markazi.com', password: 'reception123', roleId: 2, active: true, createdAt: d(-100) },
    { id: 3, name: 'رامي شاهين', email: 'rami@markazi.com', password: 'rami123', roleId: 2, active: true, createdAt: d(-40) },
  ]

  const rooms: Room[] = [
    { id: 1, name: 'قاعة ١', capacity: 20, active: true },
    { id: 2, name: 'قاعة ٢', capacity: 16, active: true },
    { id: 3, name: 'قاعة ٣', capacity: 24, active: true },
    { id: 4, name: 'قاعة الحاسوب', capacity: 14, active: true },
  ]

  const trainers: Trainer[] = [
    { id: 1, name: 'أحمد الخطيب', phone: '0944112233', specialty: 'اللغة الإنجليزية', payrollType: 'percentage', percentage: 30, active: true },
    { id: 2, name: 'سارة عباس', phone: '0955667788', specialty: 'البرمجة', payrollType: 'hourly', hourlyRate: 50000, active: true },
    { id: 3, name: 'محمد نور الدين', phone: '0933221100', specialty: 'الرياضيات', payrollType: 'fixed', fixedSalary: 4000000, active: true },
    { id: 4, name: 'رنا سلوم', phone: '0988776655', specialty: 'IELTS والإنجليزية', payrollType: 'percentage', percentage: 35, active: true },
    { id: 5, name: 'خالد إسماعيل', phone: '0999001122', specialty: 'التصميم الجرافيكي', payrollType: 'hourly', hourlyRate: 55000, active: true },
    { id: 6, name: 'هبة حسن', phone: '0911002233', specialty: 'رياضيات ومحاسبة', payrollType: 'fixed', fixedSalary: 3500000, active: true },
  ]

  const courses: Course[] = [
    { id: 1, name: 'اللغة الإنجليزية — مبتدئ', nameEn: 'English — Beginner', description: 'أساسيات اللغة الإنجليزية: قواعد، مفردات، محادثة يومية.', level: 'beginner', active: true },
    { id: 2, name: 'اللغة الإنجليزية — متوسط', nameEn: 'English — Intermediate', description: 'تعزيز المهارات الأربع مع تركيز على المحادثة والكتابة.', level: 'intermediate', active: true },
    { id: 3, name: 'تحضير IELTS', nameEn: 'IELTS Preparation', description: 'تحضير مكثف لامتحان الآيلتس الأكاديمي والعام.', level: 'advanced', active: true },
    { id: 4, name: 'برمجة بايثون', nameEn: 'Python Programming', description: 'مدخل إلى البرمجة بلغة بايثون من الصفر.', level: 'beginner', active: true },
    { id: 5, name: 'تطوير تطبيقات الويب', nameEn: 'Web Development', description: 'HTML وCSS وJavaScript وبناء مشاريع فعلية.', level: 'intermediate', active: true },
    { id: 6, name: 'رياضيات — شهادة ثانوية', nameEn: 'Math — Baccalaureate', description: 'مراجعة شاملة لمنهاج الرياضيات للشهادة الثانوية.', level: 'all', active: true },
    { id: 7, name: 'التصميم الجرافيكي', nameEn: 'Graphic Design', description: 'أساسيات التصميم وأدوات Photoshop وIllustrator.', level: 'beginner', active: true },
    { id: 8, name: 'المحاسبة المالية', nameEn: 'Financial Accounting', description: 'مبادئ المحاسبة والقيود والقوائم المالية.', level: 'intermediate', active: true },
    { id: 9, name: 'رياضيات — شهادة إعدادية', nameEn: 'Math — Brevet', description: 'تأسيس ومراجعة رياضيات الصف التاسع.', level: 'all', active: true },
  ]

  const mkSection = (
    id: number, courseId: number, trainerId: number, roomId: number, title: string,
    price: number, capacity: number, days: number[], start: string, end: string,
    startOff: number, endOff: number, status: Section['status'] = 'open',
  ): Section => ({
    id, courseId, trainerId, roomId, title, price, capacity,
    schedule: days.map((day) => ({ day, start, end })),
    startDate: d(startOff), endDate: d(endOff), status,
  })

  const sections: Section[] = [
    mkSection(1, 1, 1, 2, 'إنجليزي مبتدئ — أ', 750000, 16, [6, 1, 3], '16:00', '17:30', -28, 28),
    mkSection(2, 2, 4, 1, 'إنجليزي متوسط — أ', 850000, 20, [0, 2, 4], '17:30', '19:00', -21, 35),
    mkSection(3, 3, 4, 3, 'IELTS مكثف', 1500000, 18, [6, 3], '19:00', '20:30', -14, 42),
    mkSection(4, 4, 2, 4, 'بايثون — أ', 1200000, 14, [0, 2], '16:00', '18:00', -35, 21),
    mkSection(5, 5, 2, 4, 'تطوير ويب — أ', 1400000, 14, [6, 1], '18:00', '20:00', 7, 63),
    mkSection(6, 6, 3, 1, 'رياضيات ثانوية — أ', 900000, 20, [0, 2, 4], '15:00', '16:30', -63, -7, 'completed'),
    mkSection(7, 7, 5, 3, 'تصميم جرافيكي — أ', 950000, 18, [5], '14:00', '17:00', -14, 49),
    mkSection(8, 8, 6, 2, 'محاسبة مالية — أ', 800000, 16, [0, 3], '19:00', '20:30', -10, 40),
    mkSection(9, 9, 6, 1, 'رياضيات إعدادية — أ', 700000, 20, [6, 1], '15:00', '16:30', -20, 30),
    mkSection(10, 1, 1, 2, 'إنجليزي مبتدئ — ب', 750000, 16, [0, 2, 4], '16:00', '17:30', 10, 70),
  ]

  // ---------- sessions generated from weekly schedule ----------
  const sessions: ClassSession[] = []
  let sid = 1
  for (const s of sections) {
    const days = new Set(s.schedule.map((x) => x.day))
    let cursor = s.startDate
    let count = 0
    while (cursor <= s.endDate) {
      if (days.has(weekdayOf(cursor))) {
        const slot = s.schedule.find((x) => x.day === weekdayOf(cursor))!
        let status: ClassSession['status'] = 'scheduled'
        let note: string | undefined
        if (cursor < T) status = count % 11 === 5 ? 'cancelled' : 'held'
        else if (count % 9 === 4) {
          status = 'postponed'
          note = 'تأجيل بسبب ظرف طارئ — يُحدَّد موعد بديل لاحقاً'
        }
        if (status === 'cancelled') note = 'ألغيت بسبب عطل في القاعة'
        sessions.push({ id: sid++, sectionId: s.id, date: cursor, start: slot.start, end: slot.end, status, note })
        count++
      }
      cursor = addDaysISO(cursor, 1)
    }
  }

  // ---------- students ----------
  const names = [
    'ليث الحمصي', 'جنى مرعي', 'عمر قدور', 'سلام الأحمد', 'كريم دعبول', 'نور الهدى شعبان',
    'يزن العلي', 'ميرا قاسم', 'حمزة النجار', 'آية خطاب', 'عبد الرحمن صالح', 'ليندا حجازي',
    'مجد الرفاعي', 'رغد حداد', 'أنس كيلاني', 'بتول شريف', 'قصي حلبي', 'شهد مرتضى',
    'طه الجزائري', 'لمى عثمان', 'حسن دندش', 'ريم البني', 'جودي صابوني', 'وائل كعكة',
    'سيلينا عبود', 'باسل حورية', 'ديمة عرنوق', 'فادي غزال', 'هنا عطية', 'سامي قنوع',
    'تولين إدلبي', 'نبيل سرميني', 'آلاء دالاتي', 'روبا شعيب', 'ماهر زيتون', 'كندة علوش',
    'إيهاب شبات', 'غزل أيوب', 'رشا مكي', 'توفيق حبال',
  ]
  const students: Student[] = names.map((name, i) => ({
    id: i + 1,
    name,
    phone: '09' + String(12000000 + i * 137913).slice(0, 8),
    createdAt: d(-90 + i * 2),
    active: true,
  }))

  // ---------- enrollments ----------
  const roster: Record<number, number[]> = {
    1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    2: [5, 6, 7, 8, 17, 18, 19, 20, 21, 22, 23, 24],
    3: [9, 10, 25, 26, 27, 28, 29, 30, 31],
    4: [11, 12, 13, 14, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    5: [15, 16, 17, 18, 19, 20],
    6: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    7: [1, 3, 5, 31, 33, 35, 37],
    8: [2, 4, 6, 8, 10, 12, 14, 16],
    9: [22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 13],
    10: [3, 7, 11, 15],
  }

  const enrollments: Enrollment[] = []
  const plans: PaymentPlan[] = []
  const installments: Installment[] = []
  const payments: Payment[] = []
  const auditLog: AuditLog[] = []
  let eid = 1, pid = 1, iid = 1, payId = 1, receiptN = 1001, auditId = 1
  let gi = 0 // global enrollment index for deterministic variety

  for (const s of sections) {
    const list = roster[s.id] ?? []
    for (const studentId of list) {
      const enrollDate = addDaysISO(s.startDate, -2 - (gi % 5))
      const status: Enrollment['status'] =
        s.id === 4 && studentId === 14 ? 'withdrawn' : 'active'
      enrollments.push({ id: eid, studentId, sectionId: s.id, status, date: enrollDate })

      const isFullPay = gi % 3 === 0 || s.id === 6
      plans.push({ id: pid, enrollmentId: eid, type: isFullPay ? 'full' : 'installments', totalAmount: s.price })

      const recordPayment = (amount: number, instId: number | undefined, date: string) => {
        const usd = gi % 7 === 1
        const rate = 14800 + (gi % 3) * 200
        const amountUSD = Math.max(1, Math.round(amount / rate))
        payments.push({
          id: payId, receiptNo: `R-${receiptN++}`, enrollmentId: eid, installmentId: instId,
          amount: usd ? amountUSD : amount, currency: usd ? 'USD' : 'SYP',
          exchangeRate: usd ? rate : undefined,
          amountSYP: usd ? amountUSD * rate : amount,
          method: 'cash', date: `${date} 10:${30 + (gi % 3) * 10}`, recordedBy: gi % 4 === 0 ? 1 : 2, voided: false,
        })
        if (auditLog.length < 6) {
          auditLog.push({
            id: auditId++, userId: gi % 4 === 0 ? 1 : 2, action: 'create', entity: 'Payment',
            entityId: payId, details: `تسجيل دفعة بقيمة ${amount} ل.س — إيصال R-${receiptN - 1}`, date: `${date} 10:${30 + (gi % 3) * 10}`,
          })
        }
        payId++
      }

      if (isFullPay) {
        installments.push({ id: iid, planId: pid, amount: s.price, dueDate: enrollDate, label: 'دفعة كاملة' })
        recordPayment(s.price, iid, enrollDate)
        iid++
      } else {
        const n = 3
        const base = Math.floor(s.price / n)
        const amounts = [base, base, s.price - base * 2]
        for (let k = 0; k < n; k++) {
          const due = addDaysISO(enrollDate, k * 14)
          installments.push({ id: iid, planId: pid, amount: amounts[k], dueDate: due, label: `القسط ${k + 1}` })
          const overdueDemo = gi % 5 === 0 && k === 1 // deliberately unpaid past-due
          if (due < d(-2) && !overdueDemo && status === 'active') recordPayment(amounts[k], iid, addDaysISO(due, -(gi % 2)))
          iid++
        }
      }

      // one voided payment example (wrong amount entered, then corrected)
      if (gi === 8) {
        payments.push({
          id: payId, receiptNo: `R-${receiptN++}`, enrollmentId: eid, installmentId: undefined,
          amount: 50000, currency: 'SYP', amountSYP: 50000, method: 'cash',
          date: `${d(-6)} 12:15`, recordedBy: 2, voided: true, voidReason: 'إدخال مبلغ خاطئ',
        })
        auditLog.push({ id: auditId++, userId: 1, action: 'void', entity: 'Payment', entityId: payId, details: 'إبطال دفعة R-' + (receiptN - 1) + ' — إدخال مبلغ خاطئ', date: `${d(-6)} 12:40` })
        payId++
      }

      eid++
      pid++
      gi++
    }
  }

  const waitingList: WaitingListEntry[] = [
    { id: 1, studentId: 17, sectionId: 1, position: 1, date: d(-4), status: 'waiting' },
    { id: 2, studentId: 21, sectionId: 1, position: 2, date: d(-2), status: 'waiting' },
  ]

  // ---------- attendance for held sessions ----------
  const attendance: Attendance[] = []
  let aid = 1
  for (const sess of sessions) {
    if (sess.status !== 'held') continue
    const enrolled = enrollments.filter((e) => e.sectionId === sess.sectionId && e.status === 'active')
    for (const e of enrolled) {
      const absent = (sess.id * 7 + e.studentId * 3) % 8 === 0
      attendance.push({ id: aid++, sessionId: sess.id, studentId: e.studentId, status: absent ? 'absent' : 'present' })
    }
  }

  // ---------- grades & certificates for the completed section ----------
  const grades: Grade[] = []
  const certificates: Certificate[] = []
  let cid = 1
  const s6 = sections.find((s) => s.id === 6)!
  for (const e of enrollments.filter((x) => x.sectionId === 6)) {
    let score = 55 + ((e.studentId * 13) % 45)
    if (e.studentId === 22) score = 48 // fail case
    grades.push({ id: cid, studentId: e.studentId, sectionId: 6, score, maxScore: 100 })
    const paid = payments.filter((p) => p.enrollmentId === e.id && !p.voided).reduce((a, p) => a + p.amountSYP, 0)
    const fullyPaid = paid >= s6.price && e.studentId !== 30 // student 30 underpaid → blocked
    if (score >= 60 && fullyPaid) {
      certificates.push({
        id: cid, serial: `CERT-2026-${String(cid).padStart(3, '0')}`,
        studentId: e.studentId, sectionId: 6, issueDate: d(-5), issuedBy: 1,
      })
    }
    cid++
  }

  // ---------- expenses (last 3 months) ----------
  const expenses: Expense[] = []
  let xid = 1
  for (let m = 2; m >= 0; m--) {
    const base = new Date(T + 'T00:00:00')
    base.setMonth(base.getMonth() - m)
    const ym = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`
    expenses.push({ id: xid++, title: 'إيجار المركز', category: 'rent', amount: 2500000, date: `${ym}-01` })
    expenses.push({ id: xid++, title: 'فاتورة كهرباء ومياه', category: 'utilities', amount: 380000 + m * 35000, date: `${ym}-05` })
    if (m !== 1) expenses.push({ id: xid++, title: 'قرطاسية وأدوات تعليمية', category: 'supplies', amount: 240000 + m * 60000, date: `${ym}-12` })
  }
  expenses.push({ id: xid++, title: 'صيانة أجهزة قاعة الحاسوب', category: 'maintenance', amount: 520000, date: d(-9), notes: 'استبدال شاشتين ولوحة مفاتيح' })

  // ---------- payroll (previous month) ----------
  const prevMonth = (() => {
    const b = new Date(T + 'T00:00:00'); b.setMonth(b.getMonth() - 1)
    return `${b.getFullYear()}-${String(b.getMonth() + 1).padStart(2, '0')}`
  })()
  const payroll: TrainerPayroll[] = [
    { id: 1, trainerId: 3, month: prevMonth, amount: 4000000, details: 'راتب شهري ثابت', status: 'paid', paidAt: `${prevMonth}-28` },
    { id: 2, trainerId: 6, month: prevMonth, amount: 3500000, details: 'راتب شهري ثابت', status: 'paid', paidAt: `${prevMonth}-28` },
    { id: 3, trainerId: 2, month: prevMonth, amount: 1800000, details: '36 ساعة × 50,000 ل.س', status: 'paid', paidAt: `${prevMonth}-28` },
    { id: 4, trainerId: 5, month: prevMonth, amount: 1100000, details: '20 ساعة × 55,000 ل.س', status: 'due' },
    { id: 5, trainerId: 1, month: prevMonth, amount: 2850000, details: '30% من إيراد شعب الإنجليزي المبتدئ', status: 'due' },
    { id: 6, trainerId: 4, month: prevMonth, amount: 2450000, details: '35% من إيراد شعبتي المتوسط وIELTS', status: 'due' },
  ]
  auditLog.push({ id: auditId++, userId: 1, action: 'update', entity: 'TrainerPayroll', entityId: 1, details: `تسجيل صرف رواتب شهر ${monthKey(prevMonth)}`, date: `${prevMonth}-28 13:00` })
  auditLog.push({ id: auditId++, userId: 1, action: 'create', entity: 'Expense', entityId: 1, details: 'إضافة مصروف: إيجار المركز', date: nowISODateTime() })

  // ---------- sequence counters ----------
  const max = (arr: { id: number }[]) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1
  const seq: Record<string, number> = {
    user: max(users), role: max(roles), course: max(courses), room: max(rooms),
    trainer: max(trainers), section: max(sections), session: max(sessions),
    student: max(students), enrollment: max(enrollments), waiting: max(waitingList),
    attendance: max(attendance), grade: max(grades), certificate: max(certificates),
    plan: max(plans), installment: max(installments), payment: max(payments),
    expense: max(expenses), payroll: max(payroll), audit: max(auditLog),
    receipt: receiptN, certSerial: certificates.length + 1,
  }

  return {
    seq,
    currentUserId: null,
    roles, users, courses, rooms, trainers, sections, sessions, students,
    enrollments, waitingList, attendance, grades, certificates,
    plans, installments, payments, expenses, payroll, auditLog,
    dismissedAlerts: [],
    certTemplate: {
      centerName: 'مركز المستقبل التعليمي',
      logoText: 'م',
      signatureName: 'أ. سامر حداد',
      bodyText: 'تشهد إدارة المركز بأن الطالب/ة المذكور(ة) أدناه قد أتمّ بنجاح جميع متطلبات الدورة التدريبية، واجتاز التقييم النهائي بالعلامة المبينة، وقد مُنح هذه الشهادة تقديراً لجهوده.',
    },
    settings: {
      centerName: 'مركز المستقبل التعليمي',
      passMark: 60,
      defaultExchangeRate: 15000,
      autoBackup: true,
      backupIntervalDays: 7,
      seatHoldHours: 24,
      language: 'ar',
    },
  }
}
