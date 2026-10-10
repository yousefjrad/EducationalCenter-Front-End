import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Wallet, Plus, Printer, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { useStore, useCan, enrollmentPaid, enrollmentRemaining, planOf, installmentsOf } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import type { Enrollment, Payment } from '@/types'
import { fmtDateTime, fmtSYP, fmtNum } from '@/lib/format'
import { PageHeader, SearchInput, EmptyState, Pill, Field, TableScroll, Th, Td, Money } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function Payments() {
  const { t, lang } = useI18n()
  const { state, dispatch } = useStore()
  const canCreate = useCan('Payments.Create')
  const canVoid = useCan('Payments.Void')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [showVoided, setShowVoided] = useState('no')
  const [recordOpen, setRecordOpen] = useState(false)
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null)
  const [voidReason, setVoidReason] = useState('')

  useEffect(() => {
    if (params.get('new') === '1' && canCreate) {
      setRecordOpen(true)
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, canCreate])

  const list = useMemo(() => {
    return state.payments
      .filter((p) => (showVoided === 'yes' ? true : !p.voided))
      .filter((p) => {
        if (!q.trim()) return true
        const e = state.enrollments.find((x) => x.id === p.enrollmentId)
        const st = state.students.find((x) => x.id === e?.studentId)
        return (st?.name ?? '').includes(q.trim()) || p.receiptNo.includes(q.trim())
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [state.payments, state.enrollments, state.students, q, showVoided])

  const totalShown = list.filter((p) => !p.voided).reduce((a, p) => a + p.amountSYP, 0)

  return (
    <div>
      <PageHeader
        title={t('payments.title')} subtitle={t('payments.subtitle')}
        actions={canCreate && (
          <Button className="min-h-[44px]" onClick={() => setRecordOpen(true)}>
            <Plus className="me-2 h-4 w-4" />{t('payments.record')}
          </Button>
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} className="w-full max-w-sm" />
        <Select value={showVoided} onValueChange={setShowVoided}>
          <SelectTrigger className="min-h-[44px] w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="no">{t('payments.history')}</SelectItem>
            <SelectItem value="yes">{t('common.all')} (+ {t('payments.voided')})</SelectItem>
          </SelectContent>
        </Select>
        <Pill tone="teal" className="text-sm"><Wallet className="h-3.5 w-3.5" />{fmtSYP(totalShown, lang)}</Pill>
      </div>

      {list.length === 0 ? (
        <EmptyState message={t('payments.empty')} icon={<Wallet className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                <Th>{t('payments.receiptNo')}</Th>
                <Th>{t('common.student')}</Th>
                <Th>{t('common.section')}</Th>
                <Th>{t('common.amount')}</Th>
                <Th>{t('common.date')}</Th>
                <Th>{t('common.by')}</Th>
                <Th>{t('common.status')}</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const e = state.enrollments.find((x) => x.id === p.enrollmentId)
                const st = state.students.find((x) => x.id === e?.studentId)
                const sec = state.sections.find((x) => x.id === e?.sectionId)
                const user = state.users.find((u) => u.id === p.recordedBy)
                return (
                  <tr key={p.id} className={`border-b last:border-0 ${p.voided ? 'opacity-50' : 'hover:bg-muted/40'}`}>
                    <Td><span className="tnum font-bold" dir="ltr">{p.receiptNo}</span></Td>
                    <Td className="font-bold">{st?.name}</Td>
                    <Td className="max-w-[180px]"><span className="line-clamp-1 text-muted-foreground">{sec?.title}</span></Td>
                    <Td>
                      <Money amount={p.amountSYP} />
                      {p.currency === 'USD' && (
                        <div className="tnum text-xs text-muted-foreground" dir="ltr">${fmtNum(p.amount)} × {fmtNum(p.exchangeRate ?? 0)}</div>
                      )}
                    </Td>
                    <Td><span className="tnum whitespace-nowrap text-muted-foreground">{fmtDateTime(p.date)}</span></Td>
                    <Td><span className="text-xs text-muted-foreground">{user?.name}</span></Td>
                    <Td>{p.voided ? <Pill tone="red">{t('payments.voided')}</Pill> : <Pill tone="green">{t('payments.cash')}</Pill>}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9" title={t('payments.receipt')} onClick={() => setReceipt(p)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        {canVoid && !p.voided && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" title={t('payments.void')} onClick={() => { setVoidTarget(p); setVoidReason('') }}>
                            <Ban className="h-4 w-4" />
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

      {recordOpen && <RecordPaymentDialog onClose={() => setRecordOpen(false)} onDone={(p) => { setRecordOpen(false); setReceipt(p) }} />}
      {receipt && <ReceiptDialog payment={receipt} onClose={() => setReceipt(null)} />}

      {/* void dialog */}
      <AlertDialog open={!!voidTarget} onOpenChange={() => setVoidTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('payments.void')} — {voidTarget?.receiptNo}</AlertDialogTitle>
            <AlertDialogDescription>{voidTarget && fmtSYP(voidTarget.amountSYP, lang)}</AlertDialogDescription>
          </AlertDialogHeader>
          <Field label={t('payments.voidReason')} required>
            <Textarea rows={2} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          </Field>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-[44px]">{t('common.cancel')}</AlertDialogCancel>
            <Button
              variant="destructive" className="min-h-[44px]" disabled={!voidReason.trim()}
              onClick={() => {
                if (!voidTarget) return
                dispatch({ type: 'VOID_PAYMENT', paymentId: voidTarget.id, reason: voidReason.trim() })
                toast.success(t('payments.voidedMsg'))
                setVoidTarget(null)
              }}
            >
              {t('payments.void')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------

function RecordPaymentDialog({ onClose, onDone }: { onClose: () => void; onDone: (p: Payment) => void }) {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const [studentId, setStudentId] = useState('')
  const [enrollmentId, setEnrollmentId] = useState('')
  const [installmentId, setInstallmentId] = useState('')
  const [currency, setCurrency] = useState<'SYP' | 'USD'>('SYP')
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(String(state.settings.defaultExchangeRate))

  const activeEnrolls = state.enrollments.filter((e) => e.status === 'active')
  const studentsWithBalance = state.students.filter((s) =>
    activeEnrolls.some((e) => e.studentId === s.id && enrollmentRemaining(state, e.id) > 0),
  )

  const enrollment: Enrollment | undefined = activeEnrolls.find((e) => e.id === Number(enrollmentId) && e.studentId === Number(studentId))
  const remaining = enrollment ? enrollmentRemaining(state, enrollment.id) : 0
  const insts = enrollment ? installmentsOf(state, enrollment.id) : []

  const amountSYP = currency === 'USD' ? Math.round((Number(amount) || 0) * (Number(rate) || 0)) : Number(amount) || 0
  const exceeds = enrollment ? amountSYP > remaining : false

  const submit = () => {
    if (!enrollment) { toast.error(t('payments.selectEnrollment')); return }
    if (amountSYP <= 0) { toast.error(t('common.required')); return }
    if (exceeds) { toast.error(t('payments.exceedsRemaining')); return }
    dispatch({
      type: 'RECORD_PAYMENT',
      payment: {
        enrollmentId: enrollment.id,
        installmentId: installmentId ? Number(installmentId) : undefined,
        amount: Number(amount), currency,
        exchangeRate: currency === 'USD' ? Number(rate) : undefined,
        amountSYP,
      },
    })
    toast.success(t('payments.recorded'))
    // mirror the payment object locally so the receipt opens immediately
    const receipt: Payment = {
      id: state.seq.payment, receiptNo: `R-${state.seq.receipt}`, enrollmentId: enrollment.id,
      installmentId: installmentId ? Number(installmentId) : undefined,
      amount: Number(amount), currency, exchangeRate: currency === 'USD' ? Number(rate) : undefined,
      amountSYP, method: 'cash', date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      recordedBy: state.currentUserId ?? 1, voided: false,
    }
    onDone(receipt)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="scrollbar-thin max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>{t('payments.record')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label={t('payments.selectStudent')} required>
            <Select value={studentId} onValueChange={(v) => { setStudentId(v); setEnrollmentId(''); setInstallmentId('') }}>
              <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {studentsWithBalance.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          {studentId && (
            <Field label={t('payments.selectEnrollment')} required>
              <Select value={enrollmentId} onValueChange={(v) => { setEnrollmentId(v); setInstallmentId('') }}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {activeEnrolls.filter((e) => e.studentId === Number(studentId)).map((e) => {
                    const sec = state.sections.find((s) => s.id === e.sectionId)
                    return (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {sec?.title} — {t('common.remaining')}: {fmtSYP(enrollmentRemaining(state, e.id))}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </Field>
          )}

          {enrollment && insts.length > 1 && (
            <Field label={t('payments.selectInstallment')}>
              <Select value={installmentId || 'none'} onValueChange={(v) => setInstallmentId(v === 'none' ? '' : v)}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {insts.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.label} — {fmtSYP(i.amount)} ({fmtDateTime(i.dueDate).slice(0, 10)})</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('payments.currency')}>
              <Select value={currency} onValueChange={(v) => setCurrency(v as 'SYP' | 'USD')}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYP">{t('common.syp')}</SelectItem>
                  <SelectItem value="USD">{t('common.usd')} ($)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('common.amount')} required>
              <Input type="number" dir="ltr" className="min-h-[44px]" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          </div>

          {currency === 'USD' && (
            <Field label={t('payments.exchangeRate')} required>
              <Input type="number" dir="ltr" className="min-h-[44px]" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Field>
          )}

          {enrollment && (
            <div className="space-y-1.5 rounded-lg bg-muted/60 p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('payments.equivalent')}</span><Money amount={amountSYP} className="text-primary" /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('common.remaining')}</span><Money amount={remaining} /></div>
              {exceeds && <div className="pt-1 font-bold text-destructive">{t('payments.exceedsRemaining')}</div>}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="min-h-[44px]" disabled={!enrollment || amountSYP <= 0 || exceeds} onClick={submit}>
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------

export function ReceiptDialog({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { t, lang } = useI18n()
  const { state } = useStore()
  const e = state.enrollments.find((x) => x.id === payment.enrollmentId)
  const st = state.students.find((x) => x.id === e?.studentId)
  const sec = state.sections.find((x) => x.id === e?.sectionId)
  const user = state.users.find((u) => u.id === payment.recordedBy)
  const plan = planOf(state, payment.enrollmentId)
  const paidTotal = enrollmentPaid(state, payment.enrollmentId)
  const remaining = plan ? Math.max(0, plan.totalAmount - paidTotal) : 0

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="printable bg-white p-8 text-foreground">
          {/* receipt header */}
          <div className="flex items-center justify-between border-b-2 border-primary pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-black text-white">
                {state.certTemplate.logoText}
              </div>
              <div>
                <div className="text-lg font-black">{state.settings.centerName}</div>
                <div className="text-xs text-muted-foreground">{t('app.tagline')}</div>
              </div>
            </div>
            <div className="text-end">
              <div className="text-sm font-extrabold text-primary">{t('receipt.title')}</div>
              <div className="tnum text-xs text-muted-foreground" dir="ltr">{payment.receiptNo}</div>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm leading-relaxed">
            <div className="flex justify-between gap-4">
              <span className="shrink-0 font-bold text-muted-foreground">{t('receipt.receivedFrom')}:</span>
              <span className="font-extrabold">{st?.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 font-bold text-muted-foreground">{t('receipt.amountOf')}:</span>
              <span className="tnum font-extrabold text-primary">
                {payment.currency === 'USD'
                  ? `$${fmtNum(payment.amount)} (${fmtSYP(payment.amountSYP, lang)} — ${t('payments.exchangeRate')}: ${fmtNum(payment.exchangeRate ?? 0)})`
                  : fmtSYP(payment.amountSYP, lang)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 font-bold text-muted-foreground">{t('receipt.forSection')}:</span>
              <span className="font-bold">{sec?.title}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 font-bold text-muted-foreground">{t('common.date')}:</span>
              <span className="tnum">{fmtDateTime(payment.date)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 font-bold text-muted-foreground">{t('common.remaining')}:</span>
              <span className="tnum font-bold">{fmtSYP(remaining, lang)}</span>
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between border-t pt-4 text-sm">
            <div>
              <div className="font-bold text-muted-foreground">{t('receipt.cashier')}</div>
              <div className="mt-1 font-extrabold">{user?.name}</div>
            </div>
            <div className="text-end">
              <div className="font-bold text-muted-foreground">{t('receipt.signature')}</div>
              <div className="mt-1 font-extrabold">{state.certTemplate.signatureName}</div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">{t('receipt.thanks')}</div>
        </div>

        <div className="no-print flex items-center justify-end gap-2 border-t bg-muted/40 p-4">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.close')}</Button>
          <Button className="min-h-[44px]" onClick={() => window.print()}>
            <Printer className="me-2 h-4 w-4" />{t('common.print')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
