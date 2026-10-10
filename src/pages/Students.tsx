import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { GraduationCap, Plus, Pencil, UserPlus, ArrowLeftRight, UserMinus, Hourglass, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import {
  useStore, useCan, activeEnrollmentsOf, enrollmentPaid, enrollmentRemaining,
  isSectionFull, installmentsOf, installmentStatus,
} from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import type { Enrollment, Student } from '@/types'
import { addDaysISO, fmtDate, fmtSYP, todayISO } from '@/lib/format'
import { PageHeader, SearchInput, EmptyState, Pill, Field, TableScroll, Th, Td, Money } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function Students() {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const canManage = useCan('Students.Manage')
  const canEnroll = useCan('Enrollments.Manage')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<Student | null>(null)
  const [editStudent, setEditStudent] = useState<Student | 'new' | null>(null)
  const [enrollStudent, setEnrollStudent] = useState<Student | null>(null)
  const [withdrawTarget, setWithdrawTarget] = useState<Enrollment | null>(null)
  const [transferTarget, setTransferTarget] = useState<Enrollment | null>(null)

  useEffect(() => {
    if (params.get('enroll') === '1' && canEnroll && state.students.length > 0) {
      setEnrollStudent(state.students[0])
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, canEnroll])

  const list = useMemo(
    () => state.students.filter((s) => (s.name + s.phone).includes(q.trim())),
    [state.students, q],
  )

  const waiting = state.waitingList.filter((w) => w.status === 'waiting')

  return (
    <div>
      <PageHeader
        title={t('students.title')} subtitle={t('students.subtitle')}
        actions={
          <>
            {canEnroll && (
              <Button variant="outline" className="min-h-[44px]" onClick={() => state.students.length && setEnrollStudent(state.students[0])}>
                <UserPlus className="me-2 h-4 w-4" />{t('students.enroll')}
              </Button>
            )}
            {canManage && (
              <Button className="min-h-[44px]" onClick={() => setEditStudent('new')}>
                <Plus className="me-2 h-4 w-4" />{t('students.add')}
              </Button>
            )}
          </>
        }
      />

      {/* waiting list strip */}
      {waiting.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 font-extrabold text-amber-800">
            <Hourglass className="h-4 w-4" />{t('waiting.title')} ({waiting.length})
          </div>
          <div className="space-y-2">
            {waiting.map((w) => {
              const st = state.students.find((x) => x.id === w.studentId)
              const sec = state.sections.find((x) => x.id === w.sectionId)
              const seatFree = sec ? !isSectionFull(state, sec.id) : false
              return (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 p-3 text-sm">
                  <div className="min-w-0">
                    <span className="font-bold">{st?.name}</span>
                    <span className="text-muted-foreground"> — {sec?.title} · {t('waiting.position')} {w.position}</span>
                  </div>
                  {canEnroll && (
                    <div className="flex gap-2">
                      <Button
                        size="sm" className="min-h-[36px]" disabled={!seatFree}
                        title={seatFree ? '' : t('sections.full')}
                        onClick={() => {
                          dispatch({ type: 'PROMOTE_WAITING', waitingId: w.id })
                          toast.success(t('waiting.promoted'))
                        }}
                      >
                        {t('waiting.promote')}
                      </Button>
                      <Button
                        size="sm" variant="outline" className="min-h-[36px]"
                        onClick={() => dispatch({ type: 'CANCEL_WAITING', waitingId: w.id })}
                      >
                        {t('waiting.cancelEntry')}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <SearchInput value={q} onChange={setQ} className="mb-4 max-w-sm" />

      {list.length === 0 ? (
        <EmptyState message={q ? t('common.noResults') : t('students.empty')} icon={<GraduationCap className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[680px]">
            <thead>
              <tr>
                <Th>{t('common.name')}</Th>
                <Th>{t('common.phone')}</Th>
                <Th>{t('students.enrollments')}</Th>
                <Th>{t('common.remaining')}</Th>
                <Th>{t('common.createdAt')}</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const enrolls = state.enrollments.filter((e) => e.studentId === s.id && e.status === 'active')
                const remaining = enrolls.reduce((a, e) => a + enrollmentRemaining(state, e.id), 0)
                return (
                  <tr key={s.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/40" onClick={() => setDetail(s)}>
                    <Td><span className="font-bold">{s.name}</span></Td>
                    <Td><span className="tnum" dir="ltr">{s.phone}</span></Td>
                    <Td><span className="tnum">{enrolls.length}</span></Td>
                    <Td>{remaining > 0 ? <Money amount={remaining} className="text-destructive" /> : <span className="text-muted-foreground">—</span>}</Td>
                    <Td><span className="tnum text-muted-foreground">{fmtDate(s.createdAt)}</span></Td>
                    <Td>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {canManage && (
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditStudent(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canEnroll && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => setEnrollStudent(s)}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableScroll>
      )}

      {/* add / edit student */}
      <StudentDialog
        target={editStudent}
        onClose={() => setEditStudent(null)}
      />

      {/* enroll */}
      {enrollStudent && (
        <EnrollDialog
          student={enrollStudent}
          students={state.students}
          onStudentChange={setEnrollStudent}
          onClose={() => setEnrollStudent(null)}
        />
      )}

      {/* detail */}
      {detail && (
        <StudentDetail
          student={state.students.find((x) => x.id === detail.id)!}
          onClose={() => setDetail(null)}
          onWithdraw={setWithdrawTarget}
          onTransfer={setTransferTarget}
        />
      )}

      {/* withdraw confirm */}
      <AlertDialog open={!!withdrawTarget} onOpenChange={() => setWithdrawTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('enroll.withdraw')}</AlertDialogTitle>
            <AlertDialogDescription>{t('enroll.withdrawConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-[44px]">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!withdrawTarget) return
                dispatch({ type: 'WITHDRAW', enrollmentId: withdrawTarget.id })
                toast.success(t('enroll.withdrawn'))
                setWithdrawTarget(null)
              }}
            >
              <UserMinus className="me-2 h-4 w-4" />{t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* transfer */}
      {transferTarget && <TransferDialog enrollment={transferTarget} onClose={() => setTransferTarget(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------

function StudentDialog({ target, onClose }: { target: Student | 'new' | null; onClose: () => void }) {
  const { t } = useI18n()
  const { dispatch } = useStore()
  const editing = target !== 'new' ? target : null
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    setName(editing?.name ?? '')
    setPhone(editing?.phone ?? '')
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (!name.trim()) { toast.error(t('common.required')); return }
    dispatch({
      type: 'SAVE_STUDENT',
      student: editing
        ? { ...editing, name: name.trim(), phone: phone.trim() }
        : { id: 0, name: name.trim(), phone: phone.trim(), createdAt: todayISO(), active: true },
    })
    toast.success(t('common.saved'))
    onClose()
  }

  return (
    <Dialog open={target !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? t('students.edit') : t('students.add')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label={t('common.name')} required>
            <Input className="min-h-[44px]" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('common.phone')} required>
            <Input dir="ltr" className="min-h-[44px]" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="min-h-[44px]" onClick={save}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------

function EnrollDialog({
  student, students, onStudentChange, onClose,
}: { student: Student; students: Student[]; onStudentChange: (s: Student) => void; onClose: () => void }) {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const [sectionId, setSectionId] = useState('')
  const [payOption, setPayOption] = useState<'full' | 'installments'>('full')
  const [instCount, setInstCount] = useState('3')
  const [firstDue, setFirstDue] = useState(todayISO())
  const [intervalWeeks, setIntervalWeeks] = useState('2')

  const openSections = state.sections.filter((s) => s.status === 'open')
  const section = openSections.find((s) => s.id === Number(sectionId))
  const already = section ? state.enrollments.some((e) => e.studentId === student.id && e.sectionId === section.id && e.status === 'active') : false
  const full = section ? isSectionFull(state, section.id) : false

  const previewInstallments = useMemo(() => {
    if (!section || payOption !== 'installments') return []
    const n = Math.max(2, Number(instCount) || 2)
    const base = Math.floor(section.price / n)
    const out = []
    for (let k = 0; k < n; k++) {
      out.push({
        label: `${t('payments.installments')} ${k + 1}`,
        amount: k === n - 1 ? section.price - base * (n - 1) : base,
        dueDate: addDaysISO(firstDue, k * 7 * Math.max(1, Number(intervalWeeks) || 1)),
      })
    }
    return out
  }, [section, payOption, instCount, firstDue, intervalWeeks, t])

  const submit = () => {
    if (!section) { toast.error(t('enroll.selectSection')); return }
    if (already) { toast.error(t('enroll.alreadyEnrolled')); return }
    const plan =
      payOption === 'full'
        ? { type: 'full' as const, installments: [{ amount: section.price, dueDate: todayISO(), label: 'دفعة كاملة' }] }
        : {
            type: 'installments' as const,
            installments: previewInstallments.map((x) => ({ amount: x.amount, dueDate: x.dueDate, label: x.label })),
          }
    dispatch({
      type: 'ENROLL',
      enrollment: { id: 0, studentId: student.id, sectionId: section.id, status: 'active', date: todayISO() },
      plan,
    })
    toast.success(full ? t('enroll.waitlisted') : t('enroll.success'))
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="scrollbar-thin max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>{t('enroll.title')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label={t('common.student')} required>
            <Select value={String(student.id)} onValueChange={(v) => onStudentChange(students.find((s) => s.id === Number(v))!)}>
              <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('enroll.selectSection')} required>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {openSections.map((s) => {
                  const count = activeEnrollmentsOf(state, s.id).length
                  return (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.title} — {fmtSYP(s.price)} ({count}/{s.capacity}{isSectionFull(state, s.id) ? ` · ${t('sections.full')}` : ''})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </Field>

          {section && already && <div className="rounded-lg bg-destructive/10 p-3 text-sm font-bold text-destructive">{t('enroll.alreadyEnrolled')}</div>}
          {section && full && !already && (
            <div className="rounded-lg bg-amber-100 p-3 text-sm font-bold text-amber-800">{t('enroll.waitlisted')}</div>
          )}

          {section && !already && (
            <>
              <Field label={t('enroll.paymentOption')}>
                <RadioGroup value={payOption} onValueChange={(v) => setPayOption(v as 'full' | 'installments')} className="flex gap-4">
                  <div className="flex min-h-[44px] items-center gap-2">
                    <RadioGroupItem value="full" id="pay-full" />
                    <Label htmlFor="pay-full">{t('enroll.full')}</Label>
                  </div>
                  <div className="flex min-h-[44px] items-center gap-2">
                    <RadioGroupItem value="installments" id="pay-inst" />
                    <Label htmlFor="pay-inst">{t('enroll.plan')}</Label>
                  </div>
                </RadioGroup>
              </Field>

              {payOption === 'installments' && (
                <div className="grid grid-cols-3 gap-3">
                  <Field label={t('enroll.installmentsCount')}>
                    <Input type="number" min={2} max={12} dir="ltr" className="min-h-[44px]" value={instCount} onChange={(e) => setInstCount(e.target.value)} />
                  </Field>
                  <Field label={t('enroll.firstDue')}>
                    <Input type="date" dir="ltr" className="min-h-[44px]" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} />
                  </Field>
                  <Field label={t('enroll.interval')}>
                    <Input type="number" min={1} max={8} dir="ltr" className="min-h-[44px]" value={intervalWeeks} onChange={(e) => setIntervalWeeks(e.target.value)} />
                  </Field>
                </div>
              )}

              {payOption === 'installments' && previewInstallments.length > 0 && (
                <div className="rounded-lg border">
                  {previewInstallments.map((x, i) => (
                    <div key={i} className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-0">
                      <span className="font-bold">{x.label}</span>
                      <span className="tnum text-muted-foreground">{fmtDate(x.dueDate)}</span>
                      <Money amount={x.amount} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="min-h-[44px]" disabled={!section || already} onClick={submit}>
            {full ? t('waiting.title') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------

function StudentDetail({
  student, onClose, onWithdraw, onTransfer,
}: {
  student: Student
  onClose: () => void
  onWithdraw: (e: Enrollment) => void
  onTransfer: (e: Enrollment) => void
}) {
  const { t } = useI18n()
  const { state } = useStore()
  const canEnroll = useCan('Enrollments.Manage')
  const enrolls = state.enrollments.filter((e) => e.studentId === student.id)
  const active = enrolls.filter((e) => e.status === 'active')
  const totalPaid = enrolls.reduce((a, e) => a + enrollmentPaid(state, e.id), 0)
  const totalDue = active.reduce((a, e) => a + enrollmentRemaining(state, e.id), 0)

  const attRecords = state.attendance.filter((a) => a.studentId === student.id)
  const present = attRecords.filter((a) => a.status === 'present').length
  const attRate = attRecords.length > 0 ? Math.round((present / attRecords.length) * 100) : null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="scrollbar-thin max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('students.totalPaid')}</div><div className="tnum font-extrabold text-[hsl(var(--success))]">{fmtSYP(totalPaid)}</div></div>
          <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('students.totalDue')}</div><div className="tnum font-extrabold text-destructive">{fmtSYP(totalDue)}</div></div>
          <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('students.attendanceRate')}</div><div className="tnum font-extrabold">{attRate !== null ? `${attRate}%` : '—'}</div></div>
        </div>

        <div className="mt-4 space-y-3">
          {enrolls.length === 0 && <EmptyState message={t('students.empty')} />}
          {enrolls.map((e) => {
            const sec = state.sections.find((s) => s.id === e.sectionId)
            const insts = installmentsOf(state, e.id)
            return (
              <div key={e.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold">{sec?.title}</div>
                    <div className="tnum text-xs text-muted-foreground">{fmtDate(e.date)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={e.status === 'active' ? 'green' : e.status === 'withdrawn' ? 'red' : 'blue'}>
                      {t(`enroll.status.${e.status}`)}
                    </Pill>
                    {canEnroll && e.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm" className="min-h-[36px]" onClick={() => { onClose(); onTransfer(e) }}>
                          <ArrowLeftRight className="me-1 h-3.5 w-3.5" />{t('enroll.transfer')}
                        </Button>
                        <Button variant="ghost" size="sm" className="min-h-[36px] text-destructive" onClick={() => onWithdraw(e)}>
                          <UserMinus className="me-1 h-3.5 w-3.5" />{t('enroll.withdraw')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {insts.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {insts.map((inst) => {
                      const st = installmentStatus(state, inst)
                      return (
                        <div key={inst.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                          <span>{inst.label}</span>
                          <span className="tnum text-xs text-muted-foreground">{fmtDate(inst.dueDate)}</span>
                          <Money amount={inst.amount} className="text-xs" />
                          <Pill tone={st === 'paid' ? 'green' : st === 'overdue' ? 'red' : st === 'partial' ? 'amber' : 'gray'}>
                            {t(`payments.installment.${st}`)}
                          </Pill>
                        </div>
                      )
                    })}
                  </div>
                )}

                {(() => {
                  const grade = state.grades.find((g) => g.studentId === student.id && g.sectionId === e.sectionId)
                  const cert = state.certificates.find((c) => c.studentId === student.id && c.sectionId === e.sectionId)
                  if (!grade && !cert) return null
                  return (
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                      {grade && <Pill tone={grade.score >= state.settings.passMark ? 'green' : 'red'}>{t('cert.score')}: {grade.score}</Pill>}
                      {cert && <Pill tone="purple">{t('cert.issued')} — {cert.serial}</Pill>}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {active.length > 0 && totalDue > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm font-bold text-primary">
            <Wallet className="h-4 w-4" />
            {t('students.totalDue')}: {fmtSYP(totalDue)}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------

function TransferDialog({ enrollment, onClose }: { enrollment: Enrollment; onClose: () => void }) {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const [target, setTarget] = useState('')
  const options = state.sections.filter(
    (s) => s.status === 'open' && s.id !== enrollment.sectionId && !isSectionFull(state, s.id),
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('enroll.transfer')}</DialogTitle></DialogHeader>
        <Field label={t('enroll.selectSection')} required>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {options.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.title} — {fmtSYP(s.price)}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            className="min-h-[44px]" disabled={!target}
            onClick={() => {
              dispatch({ type: 'TRANSFER', enrollmentId: enrollment.id, newSectionId: Number(target) })
              toast.success(t('enroll.transferDone'))
              onClose()
            }}
          >
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
