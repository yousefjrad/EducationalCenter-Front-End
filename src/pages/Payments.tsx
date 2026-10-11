import { useEffect, useMemo, useState } from 'react'
import { Loader2, FileText, Wallet, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, ApiError } from '@/services/api'
import type { EnrollmentDto } from '@/services/enrollments'
import {
  paymentsApi, plansApi, openReceiptPdf,
  type Currency, type InstallmentDto, type InstallmentStatus, type PaymentDto, type PaymentPlanDto,
  type PaymentStatus, type PlanStatus,
} from '@/services/payments'

const L = {
  title: '\u0627\u0644\u062f\u0641\u0639\u0627\u062a',
  subtitle: '\u0627\u0644\u062f\u0641\u0639\u0627\u062a \u0648\u062e\u0637\u0637 \u0627\u0644\u0623\u0642\u0633\u0627\u0637 \u0648\u0627\u0644\u0625\u064a\u0635\u0627\u0644\u0627\u062a',
  tabPay: '\u0633\u062c\u0644 \u0627\u0644\u062f\u0641\u0639\u0627\u062a',
  tabPlans: '\u062e\u0637\u0637 \u0627\u0644\u062f\u0641\u0639 \u0648\u0627\u0644\u0623\u0642\u0633\u0627\u0637',
  allStatus: '\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
  from: '\u0645\u0646 \u062a\u0627\u0631\u064a\u062e',
  to: '\u0625\u0644\u0649 \u062a\u0627\u0631\u064a\u062e',
  receipt: '\u0627\u0644\u0625\u064a\u0635\u0627\u0644',
  student: '\u0627\u0644\u0637\u0627\u0644\u0628',
  section: '\u0627\u0644\u0634\u0639\u0628\u0629',
  inst: '\u0627\u0644\u0642\u0633\u0637',
  amount: '\u0627\u0644\u0645\u0628\u0644\u063a',
  inSyp: '\u0628\u0627\u0644\u0644\u064a\u0631\u0629',
  date: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
  status: '\u0627\u0644\u062d\u0627\u0644\u0629',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a',
  pdf: '\u0625\u064a\u0635\u0627\u0644 PDF',
  cancelPay: '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062f\u0641\u0639\u0629',
  cancelTitle: '\u0625\u0644\u063a\u0627\u0621 \u062f\u0641\u0639\u0629',
  reason: '\u0633\u0628\u0628 \u0627\u0644\u0625\u0644\u063a\u0627\u0621 (\u0645\u0637\u0644\u0648\u0628)',
  cancelNote: '\u062a\u0628\u0642\u0649 \u0627\u0644\u062f\u0641\u0639\u0629 \u0645\u0633\u062c\u0644\u0629 \u0628\u062d\u0627\u0644\u0629 \u0645\u0644\u063a\u0627\u0629 \u0648\u0644\u0627 \u062a\u064f\u062d\u0630\u0641 (\u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0645\u062f\u064a\u0631 \u0641\u0642\u0637).',
  back: '\u0631\u062c\u0648\u0639',
  confirm: '\u062a\u0623\u0643\u064a\u062f',
  prev: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  page: '\u0635\u0641\u062d\u0629',
  pickEnroll: '\u0627\u062e\u062a\u0631 \u062a\u0633\u062c\u064a\u0644\u0627\u064b (\u0637\u0627\u0644\u0628 - \u0634\u0639\u0628\u0629)',
  search: '\u0627\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628 \u0623\u0648 \u0627\u0644\u0634\u0639\u0628\u0629\u2026',
  noPlan: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062e\u0637\u0629 \u062f\u0641\u0639 \u0644\u0647\u0630\u0627 \u0627\u0644\u062a\u0633\u062c\u064a\u0644. \u0623\u0646\u0634\u0626 \u062e\u0637\u0629:',
  count: '\u0639\u062f\u062f \u0627\u0644\u0623\u0642\u0633\u0627\u0637 (1 = \u062f\u0641\u0639 \u0643\u0627\u0645\u0644\u060c \u062d\u062a\u0649 24)',
  firstDue: '\u0627\u0633\u062a\u062d\u0642\u0627\u0642 \u0623\u0648\u0644 \u0642\u0633\u0637',
  createPlan: '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062e\u0637\u0629',
  total: '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a',
  paid: '\u0627\u0644\u0645\u062f\u0641\u0648\u0639',
  remaining: '\u0627\u0644\u0645\u062a\u0628\u0642\u064a',
  due: '\u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642',
  pay: '\u062a\u0633\u062c\u064a\u0644 \u062f\u0641\u0639\u0629',
  payTitle: '\u062a\u0633\u062c\u064a\u0644 \u062f\u0641\u0639\u0629 \u0646\u0642\u062f\u064a\u0629',
  currency: '\u0627\u0644\u0639\u0645\u0644\u0629',
  syp: '\u0644\u064a\u0631\u0629 \u0633\u0648\u0631\u064a\u0629',
  usd: '\u062f\u0648\u0644\u0627\u0631',
  amountPaid: '\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062f\u0641\u0648\u0639',
  rate: '\u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641 (\u0644\u064a\u0631\u0629 \u0644\u0643\u0644 1 \u062f\u0648\u0644\u0627\u0631)',
  equals: '\u0645\u0627 \u064a\u0639\u0627\u062f\u0644',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
  okPay: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u0641\u0639\u0629 \u0648\u0625\u0635\u062f\u0627\u0631 \u0627\u0644\u0625\u064a\u0635\u0627\u0644',
  okCancel: '\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062f\u0641\u0639\u0629',
  okPlan: '\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u062e\u0637\u0629 \u0627\u0644\u062f\u0641\u0639',
  pdfFail: '\u062a\u0639\u0630\u0631 \u0641\u062a\u062d \u0627\u0644\u0625\u064a\u0635\u0627\u0644',
}

const PAY_AR: Record<PaymentStatus, string> = { Valid: '\u0635\u0627\u0644\u062d\u0629', Cancelled: '\u0645\u0644\u063a\u0627\u0629' }
const PAY_TONE: Record<PaymentStatus, 'green' | 'red'> = { Valid: 'green', Cancelled: 'red' }
const INST_AR: Record<InstallmentStatus, string> = {
  Unpaid: '\u063a\u064a\u0631 \u0645\u062f\u0641\u0648\u0639', PartiallyPaid: '\u062c\u0632\u0626\u064a', Paid: '\u0645\u062f\u0641\u0648\u0639', Overdue: '\u0645\u062a\u0623\u062e\u0631',
}
const INST_TONE: Record<InstallmentStatus, 'gray' | 'amber' | 'green' | 'red'> = {
  Unpaid: 'gray', PartiallyPaid: 'amber', Paid: 'green', Overdue: 'red',
}
const PLAN_AR: Record<PlanStatus, string> = { Open: '\u0645\u0641\u062a\u0648\u062d\u0629', FullyPaid: '\u0645\u0633\u062f\u062f\u0629', Cancelled: '\u0645\u0644\u063a\u0627\u0629' }
const PLAN_TONE: Record<PlanStatus, 'teal' | 'green' | 'red'> = { Open: 'teal', FullyPaid: 'green', Cancelled: 'red' }

const PAGE_SIZE = 20
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const d10 = (s: string) => s.slice(0, 10)
const pagesOf = (t: number) => Math.max(1, Math.ceil(t / PAGE_SIZE))
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Payments() {
  const [tab, setTab] = useState('pay')
  const [reloadKey, setReloadKey] = useState(0)

  // ----- payments list -----
  const [items, setItems] = useState<PaymentDto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<PaymentStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelFor, setCancelFor] = useState<PaymentDto | null>(null)
  const [reason, setReason] = useState('')

  // ----- plans -----
  const [enrolls, setEnrolls] = useState<EnrollmentDto[]>([])
  const [filter, setFilter] = useState('')
  const [enrollId, setEnrollId] = useState('')
  const [plan, setPlan] = useState<PaymentPlanDto | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [noPlan, setNoPlan] = useState(false)
  const [count, setCount] = useState('1')
  const [firstDue, setFirstDue] = useState(today())
  const [payFor, setPayFor] = useState<InstallmentDto | null>(null)
  const [cur, setCur] = useState<Currency>('Syp')
  const [amt, setAmt] = useState('')
  const [rate, setRate] = useState('')
  const [busy, setBusy] = useState(false)
  const [planKey, setPlanKey] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    paymentsApi
      .list({ status, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) { setItems(r.items); setTotal(r.totalCount ?? r.total ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [status, from, to, page, reloadKey])

  useEffect(() => {
    ;(api.get('/enrollments?status=Confirmed&pageSize=100') as Promise<{ items: EnrollmentDto[] }>)
      .then((r) => setEnrolls(r.items))
      .catch(() => { /* ignore */ })
  }, [])

  useEffect(() => {
    if (!enrollId) { setPlan(null); setNoPlan(false); return }
    let alive = true
    setPlanLoading(true)
    plansApi
      .get(Number(enrollId))
      .then((p) => { if (alive) { setPlan(p); setNoPlan(false) } })
      .catch((e) => {
        if (!alive) return
        setPlan(null)
        setNoPlan(true)
        const st = (e as { status?: number }).status
        if (st !== undefined && st !== 404) toast.error(errMsg(e))
      })
      .finally(() => { if (alive) setPlanLoading(false) })
    return () => { alive = false }
  }, [enrollId, planKey])

  const options = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return enrolls
      .filter((e) => !q || e.studentName.toLowerCase().includes(q) || e.sectionName.toLowerCase().includes(q))
      .slice(0, 100)
  }, [enrolls, filter])

  const act = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
      after?.()
      setReloadKey((k) => k + 1)
      setPlanKey((k) => k + 1)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const openPdf = (id: number) => { openReceiptPdf(id).catch(() => toast.error(L.pdfFail)) }

  const openPay = (i: InstallmentDto) => { setPayFor(i); setCur('Syp'); setAmt(String(i.remainingInSyp)); setRate('') }
  const usdPreview = cur === 'Usd' && Number(amt) > 0 && Number(rate) > 0 ? Math.round(Number(amt) * Number(rate)) : null

  const doPay = () => payFor && act(
    () => paymentsApi.record({
      installmentId: payFor.id, currency: cur, amountPaid: Number(amt), exchangeRate: cur === 'Usd' ? Number(rate) : null,
    }),
    L.okPay, () => setPayFor(null),
  )

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pay" className="min-h-[44px] gap-2"><Wallet className="h-4 w-4" />{L.tabPay}</TabsTrigger>
          <TabsTrigger value="plans" className="min-h-[44px] gap-2"><Layers className="h-4 w-4" />{L.tabPlans}</TabsTrigger>
        </TabsList>

        {/* ---------------- payments list ---------------- */}
        <TabsContent value="pay">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select className={field} value={status} onChange={(e) => { setStatus(e.target.value as PaymentStatus | ''); setPage(1) }}>
              <option value="">{L.allStatus}</option>
              {(Object.keys(PAY_AR) as PaymentStatus[]).map((k) => <option key={k} value={k}>{PAY_AR[k]}</option>)}
            </select>
            <input type="date" className={field} title={L.from} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
            <input type="date" className={field} title={L.to} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
          ) : (
            <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{L.receipt}</th><th className={th}>{L.student}</th><th className={th}>{L.section}</th>
                    <th className={th}>{L.inst}</th><th className={th}>{L.amount}</th><th className={th}>{L.inSyp}</th>
                    <th className={th}>{L.date}</th><th className={th}>{L.status}</th><th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td className={td}><span className="tnum" dir="ltr">{p.receiptNumber ?? '-'}</span></td>
                      <td className={td}><b>{p.studentName}</b></td>
                      <td className={td}>{p.sectionName}</td>
                      <td className={td}><span className="tnum">#{p.installmentNumber}</span></td>
                      <td className={td}><span className="tnum" dir="ltr">{p.currency === 'Usd' ? `$${p.amountPaid}` : n0(p.amountPaid)}</span>
                        {p.currency === 'Usd' && p.exchangeRate && <div className="tnum text-[11px] text-muted-foreground">x {n0(p.exchangeRate)}</div>}
                      </td>
                      <td className={td}><span className="tnum">{n0(p.amountInSyp)}</span></td>
                      <td className={td}><span className="tnum">{d10(p.paidAt)}</span></td>
                      <td className={td}>
                        <Pill tone={PAY_TONE[p.status]}>{PAY_AR[p.status]}</Pill>
                        {p.cancelReason && <div className="mt-1 text-[11px] text-muted-foreground">{p.cancelReason}</div>}
                      </td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          {p.receiptId && (
                            <Button size="sm" variant="outline" onClick={() => openPdf(p.receiptId as number)}>
                              <FileText className="me-1 h-3.5 w-3.5" />{L.pdf}
                            </Button>
                          )}
                          {p.status === 'Valid' && (
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => { setCancelFor(p); setReason('') }}>
                              {L.cancelPay}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-3 text-sm">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{L.prev}</Button>
            <span className="tnum">{L.page} {page} / {pagesOf(total)}</span>
            <Button variant="outline" size="sm" disabled={page >= pagesOf(total)} onClick={() => setPage(page + 1)}>{L.next}</Button>
          </div>
        </TabsContent>

        {/* ---------------- plans ---------------- */}
        <TabsContent value="plans">
          <div className="mb-3 space-y-2">
            <input className={field} placeholder={L.search} value={filter} onChange={(e) => setFilter(e.target.value)} />
            <select className={field} value={enrollId} onChange={(e) => setEnrollId(e.target.value)}>
              <option value="">{L.pickEnroll}</option>
              {options.map((e) => <option key={e.id} value={e.id}>{e.studentName} - {e.sectionName}</option>)}
            </select>
          </div>

          {planLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

          {!planLoading && enrollId && noPlan && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 text-sm font-bold">{L.noPlan}</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">{L.count}</div>
                  <input type="number" min={1} max={24} dir="ltr" className={field} value={count} onChange={(e) => setCount(e.target.value)} />
                </div>
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">{L.firstDue}</div>
                  <input type="date" className={field} value={firstDue} onChange={(e) => setFirstDue(e.target.value)} />
                </div>
              </div>
              <Button className="mt-3 min-h-[44px]" disabled={busy || !count || !firstDue}
                onClick={() => act(() => plansApi.create({ enrollmentId: Number(enrollId), installmentsCount: Number(count), firstDueDate: firstDue }), L.okPlan)}>
                {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.createPlan}
              </Button>
            </div>
          )}

          {!planLoading && plan && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="font-extrabold">{plan.studentName} - {plan.sectionName}</div>
                <Pill tone={PLAN_TONE[plan.status]}>{PLAN_AR[plan.status]}</Pill>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{L.total}</div><div className="tnum font-extrabold">{n0(plan.totalAmount)}</div></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{L.paid}</div><div className="tnum font-extrabold text-emerald-700">{n0(plan.paidAmountInSyp)}</div></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{L.remaining}</div><div className="tnum font-extrabold text-destructive">{n0(plan.remainingInSyp)}</div></div>
              </div>
              <div className="scrollbar-thin overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>{L.inst}</th><th className={th}>{L.amount}</th><th className={th}>{L.due}</th>
                      <th className={th}>{L.paid}</th><th className={th}>{L.remaining}</th><th className={th}>{L.status}</th><th className={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.installments.map((i) => (
                      <tr key={i.id}>
                        <td className={td}><span className="tnum">#{i.number}</span></td>
                        <td className={td}><span className="tnum">{n0(i.amount)}</span></td>
                        <td className={td}><span className="tnum">{d10(i.dueDate)}</span></td>
                        <td className={td}><span className="tnum">{n0(i.paidAmountInSyp)}</span></td>
                        <td className={td}><span className="tnum">{n0(i.remainingInSyp)}</span></td>
                        <td className={td}><Pill tone={INST_TONE[i.status]}>{INST_AR[i.status]}</Pill></td>
                        <td className={td}>
                          {plan.status === 'Open' && i.remainingInSyp > 0 && (
                            <Button size="sm" onClick={() => openPay(i)}>{L.pay}</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* pay dialog */}
      <Dialog open={!!payFor} onOpenChange={(o) => { if (!o) setPayFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.payTitle}</DialogTitle></DialogHeader>
          {payFor && (
            <div className="text-sm">{L.inst} #{payFor.number} - {L.remaining}: <b className="tnum">{n0(payFor.remainingInSyp)}</b></div>
          )}
          <div className="space-y-2">
            <select className={field} value={cur} onChange={(e) => { setCur(e.target.value as Currency); if (payFor && e.target.value === 'Syp') setAmt(String(payFor.remainingInSyp)); if (e.target.value === 'Usd') setAmt('') }}>
              <option value="Syp">{L.syp}</option>
              <option value="Usd">{L.usd}</option>
            </select>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{L.amountPaid}</div>
              <input type="number" min={0} dir="ltr" className={field} value={amt} onChange={(e) => setAmt(e.target.value)} />
            </div>
            {cur === 'Usd' && (
              <div>
                <div className="mb-1 text-xs text-muted-foreground">{L.rate}</div>
                <input type="number" min={0} dir="ltr" className={field} value={rate} onChange={(e) => setRate(e.target.value)} />
                {usdPreview !== null && <div className="tnum mt-1 text-xs text-muted-foreground">{L.equals}: {n0(usdPreview)}</div>}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayFor(null)}>{L.back}</Button>
            <Button disabled={busy || !(Number(amt) > 0) || (cur === 'Usd' && !(Number(rate) > 0))} onClick={doPay}>
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* cancel payment dialog */}
      <Dialog open={!!cancelFor} onOpenChange={(o) => { if (!o) setCancelFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.cancelTitle}</DialogTitle></DialogHeader>
          {cancelFor && <div className="text-sm"><b>{cancelFor.studentName}</b> - {cancelFor.receiptNumber} - <span className="tnum">{n0(cancelFor.amountInSyp)}</span></div>}
          <div className="text-xs text-muted-foreground">{L.cancelNote}</div>
          <input className={field} placeholder={L.reason} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelFor(null)}>{L.back}</Button>
            <Button variant="destructive" disabled={busy || !reason.trim()}
              onClick={() => cancelFor && act(() => paymentsApi.cancel(cancelFor.id, reason.trim()), L.okCancel, () => setCancelFor(null))}>
              {L.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}