import { BranchBadge } from '@/lib/branchNames'
import { useEffect, useState } from 'react'
import { Calculator, Loader2, Pencil, Plus, ReceiptText, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, ApiError } from '@/services/api'
import {
  expensesApi, payrollApi,
  type Currency, type ExpenseDto, type PayrollCalcDto, type PayrollDto, type PayrollStatus,
} from '@/services/expenses'

const L = {
  title: '\u0627\u0644\u0645\u0635\u0627\u0631\u064a\u0641 \u0648\u0627\u0644\u0631\u0648\u0627\u062a\u0628',
  subtitle: '\u0645\u0635\u0627\u0631\u064a\u0641 \u0627\u0644\u0645\u0631\u0643\u0632 \u0648\u0631\u0648\u0627\u062a\u0628 \u0627\u0644\u0645\u062f\u0631\u0628\u064a\u0646',
  tabExp: '\u0627\u0644\u0645\u0635\u0627\u0631\u064a\u0641',
  tabPay: '\u0631\u0648\u0627\u062a\u0628 \u0627\u0644\u0645\u062f\u0631\u0628\u064a\u0646',
  addExp: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0635\u0631\u0648\u0641',
  editExp: '\u062a\u0639\u062f\u064a\u0644 \u0645\u0635\u0631\u0648\u0641',
  allCats: '\u0643\u0644 \u0627\u0644\u062a\u0635\u0646\u064a\u0641\u0627\u062a',
  category: '\u0627\u0644\u062a\u0635\u0646\u064a\u0641',
  catHint: '\u0627\u0644\u062a\u0635\u0646\u064a\u0641 (\u0645\u062b\u0644\u0627\u064b: \u0625\u064a\u062c\u0627\u0631\u060c \u0643\u0647\u0631\u0628\u0627\u0621)',
  description: '\u0627\u0644\u0648\u0635\u0641',
  amount: '\u0627\u0644\u0645\u0628\u0644\u063a',
  inSyp: '\u0628\u0627\u0644\u0644\u064a\u0631\u0629',
  date: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
  from: '\u0645\u0646 \u062a\u0627\u0631\u064a\u062e',
  to: '\u0625\u0644\u0649 \u062a\u0627\u0631\u064a\u062e',
  currency: '\u0627\u0644\u0639\u0645\u0644\u0629',
  syp: '\u0644\u064a\u0631\u0629 \u0633\u0648\u0631\u064a\u0629',
  usd: '\u062f\u0648\u0644\u0627\u0631',
  rate: '\u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641 (\u0644\u064a\u0631\u0629 \u0644\u0643\u0644 1 \u062f\u0648\u0644\u0627\u0631)',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a',
  noDelete: '\u0627\u0644\u0645\u0635\u0627\u0631\u064a\u0641 \u062a\u064f\u0639\u062f\u0651\u0644 \u0648\u062a\u064f\u062f\u0642\u0651\u0642 \u0648\u0644\u0627 \u062a\u064f\u062d\u0630\u0641.',
  save: '\u062d\u0641\u0638',
  back: '\u0631\u062c\u0648\u0639',
  confirm: '\u062a\u0623\u0643\u064a\u062f',
  saved: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638',
  prev: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  page: '\u0635\u0641\u062d\u0629',
  trainer: '\u0627\u0644\u0645\u062f\u0631\u0628',
  allTrainers: '\u0643\u0644 \u0627\u0644\u0645\u062f\u0631\u0628\u064a\u0646',
  allStatus: '\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
  status: '\u0627\u0644\u062d\u0627\u0644\u0629',
  period: '\u0627\u0644\u0641\u062a\u0631\u0629',
  method: '\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062d\u0633\u0627\u0628',
  calc: '\u0627\u062d\u062a\u0633\u0627\u0628 \u0631\u0627\u062a\u0628',
  calcTitle: '\u0627\u062d\u062a\u0633\u0627\u0628 \u0631\u0627\u062a\u0628 \u0645\u062f\u0631\u0628',
  pickTrainer: '\u0627\u062e\u062a\u0631 \u0645\u062f\u0631\u0628\u0627\u064b',
  periodStart: '\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u0641\u062a\u0631\u0629',
  periodEnd: '\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u0641\u062a\u0631\u0629',
  preview: '\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u062d\u0633\u0627\u0628',
  saveDue: '\u062d\u0641\u0638 \u0643\u0645\u0633\u062a\u062d\u0642',
  previewNote: '\u0645\u0639\u0627\u064a\u0646\u0629 \u0641\u0642\u0637 \u0644\u0627 \u064a\u064f\u062d\u0641\u0638 \u0634\u064a\u0621 \u062d\u062a\u0649 \u062a\u0636\u063a\u0637 \u062d\u0641\u0638.',
  hours: '\u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644',
  months: '\u0639\u062f\u062f \u0627\u0644\u0623\u0634\u0647\u0631',
  revenue: '\u0627\u0644\u0625\u064a\u0631\u0627\u062f \u0627\u0644\u0645\u062d\u0635\u0651\u0644 (\u0644\u064a\u0631\u0629)',
  pay: '\u062a\u0633\u062f\u064a\u062f',
  payTitle: '\u062a\u0633\u062f\u064a\u062f \u0631\u0627\u062a\u0628 (\u0627\u0644\u0645\u062f\u064a\u0631)',
  newRate: '\u0633\u0639\u0631 \u0635\u0631\u0641 \u062c\u062f\u064a\u062f \u0639\u0646\u062f \u0627\u0644\u062f\u0641\u0639 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)',
  cancelPay: '\u0625\u0644\u063a\u0627\u0621',
  cancelTitle: '\u0625\u0644\u063a\u0627\u0621 \u0631\u0627\u062a\u0628 \u0645\u0633\u062a\u062d\u0642',
  reason: '\u0633\u0628\u0628 \u0627\u0644\u0625\u0644\u063a\u0627\u0621 (\u0645\u0637\u0644\u0648\u0628)',
  okPay: '\u062a\u0645 \u062a\u0633\u062f\u064a\u062f \u0627\u0644\u0631\u0627\u062a\u0628',
  okCancel: '\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0631\u0627\u062a\u0628',
  okCreate: '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0631\u0627\u062a\u0628 \u0643\u0645\u0633\u062a\u062d\u0642',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
}

const ST_AR: Record<PayrollStatus, string> = { Due: '\u0645\u0633\u062a\u062d\u0642', Paid: '\u0645\u062f\u0641\u0648\u0639', Cancelled: '\u0645\u0644\u063a\u0649' }
const ST_TONE: Record<PayrollStatus, 'amber' | 'green' | 'red'> = { Due: 'amber', Paid: 'green', Cancelled: 'red' }

interface TrainerLite { id: number; fullName: string; payCurrency: Currency; isActive: boolean }

const PAGE_SIZE = 20
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const money = (cur: Currency, n: number) => (cur === 'Usd' ? `$${n}` : n0(n))
const pagesOf = (t: number) => Math.max(1, Math.ceil(t / PAGE_SIZE))
const pad = (n: number) => String(n).padStart(2, '0')
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default function Expenses() {
  const [tab, setTab] = useState('exp')
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)
  const [busy, setBusy] = useState(false)
  const [trainers, setTrainers] = useState<TrainerLite[]>([])
  const [cats, setCats] = useState<string[]>([])

  // ---- expenses ----
  const [eItems, setEItems] = useState<ExpenseDto[]>([])
  const [eTotal, setETotal] = useState(0)
  const [ePage, setEPage] = useState(1)
  const [eCat, setECat] = useState('')
  const [eFrom, setEFrom] = useState('')
  const [eTo, setETo] = useState('')
  const [eLoading, setELoading] = useState(true)
  const [expDlg, setExpDlg] = useState<ExpenseDto | 'new' | null>(null)
  const [xCat, setXCat] = useState('')
  const [xDesc, setXDesc] = useState('')
  const [xCur, setXCur] = useState<Currency>('Syp')
  const [xAmt, setXAmt] = useState('')
  const [xRate, setXRate] = useState('')
  const [xDate, setXDate] = useState(isoDay(new Date()))

  // ---- payroll ----
  const [pItems, setPItems] = useState<PayrollDto[]>([])
  const [pTotal, setPTotal] = useState(0)
  const [pPage, setPPage] = useState(1)
  const [pTrainer, setPTrainer] = useState('')
  const [pStatus, setPStatus] = useState<PayrollStatus | ''>('')
  const [pLoading, setPLoading] = useState(true)
  const [calcOpen, setCalcOpen] = useState(false)
  const [cTrainer, setCTrainer] = useState('')
  const [cStart, setCStart] = useState('')
  const [cEnd, setCEnd] = useState('')
  const [cRate, setCRate] = useState('')
  const [calc, setCalc] = useState<PayrollCalcDto | null>(null)
  const [payFor, setPayFor] = useState<PayrollDto | null>(null)
  const [payRate, setPayRate] = useState('')
  const [cancelFor, setCancelFor] = useState<PayrollDto | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    ;(api.get('/trainers?pageSize=100') as Promise<{ items: TrainerLite[] }>)
      .then((r) => setTrainers(r.items))
      .catch(() => { /* ignore */ })
  }, [])

  useEffect(() => {
    expensesApi.categories().then(setCats).catch(() => { /* ignore */ })
  }, [reloadKey])

  useEffect(() => {
    let alive = true
    setELoading(true)
    expensesApi
      .list({ category: eCat || undefined, from: eFrom || undefined, to: eTo || undefined, page: ePage, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) { setEItems(r.items); setETotal(r.totalCount ?? r.total ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setELoading(false) })
    return () => { alive = false }
  }, [eCat, eFrom, eTo, ePage, reloadKey])

  useEffect(() => {
    let alive = true
    setPLoading(true)
    payrollApi
      .list({ trainerId: pTrainer ? Number(pTrainer) : undefined, status: pStatus, page: pPage, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) { setPItems(r.items); setPTotal(r.totalCount ?? r.total ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setPLoading(false) })
    return () => { alive = false }
  }, [pTrainer, pStatus, pPage, reloadKey])

  const act = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
      after?.()
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  // ---- expense dialog ----
  const openExp = (x: ExpenseDto | 'new') => {
    setExpDlg(x)
    if (x === 'new') { setXCat(''); setXDesc(''); setXCur('Syp'); setXAmt(''); setXRate(''); setXDate(isoDay(new Date())) }
    else { setXCat(x.category); setXDesc(x.description); setXCur(x.currency); setXAmt(String(x.amount)); setXRate(x.exchangeRate ? String(x.exchangeRate) : ''); setXDate(x.expenseDate.slice(0, 10)) }
  }
  const saveExp = () => {
    const body = {
      category: xCat.trim(), description: xDesc.trim(), currency: xCur, amount: Number(xAmt),
      exchangeRate: xCur === 'Usd' ? Number(xRate) : null, expenseDate: xDate,
    }
    return act(
      () => (expDlg === 'new' || expDlg === null ? expensesApi.create(body) : expensesApi.update(expDlg.id, body)),
      L.saved, () => setExpDlg(null),
    )
  }
  const expValid = xCat.trim() && xDesc.trim() && Number(xAmt) > 0 && xDate && (xCur === 'Syp' || Number(xRate) > 0)

  // ---- payroll dialogs ----
  const trainerOf = (id: string) => trainers.find((t) => t.id === Number(id))
  const calcNeedsRate = trainerOf(cTrainer)?.payCurrency === 'Usd'
  const calcBody = () => ({
    trainerId: Number(cTrainer), periodStart: cStart, periodEnd: cEnd, exchangeRate: calcNeedsRate ? Number(cRate) : null,
  })
  const openCalc = () => {
    const now = new Date()
    setCTrainer(''); setCStart(isoDay(new Date(now.getFullYear(), now.getMonth(), 1))); setCEnd(isoDay(now)); setCRate(''); setCalc(null)
    setCalcOpen(true)
  }
  const doPreview = async () => {
    setBusy(true)
    try { setCalc(await payrollApi.calculate(calcBody())) } catch (e) { toast.error(errMsg(e)); setCalc(null) } finally { setBusy(false) }
  }
  const calcValid = cTrainer && cStart && cEnd && (!calcNeedsRate || Number(cRate) > 0)

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="exp" className="min-h-[44px] gap-2"><ReceiptText className="h-4 w-4" />{L.tabExp}</TabsTrigger>
          <TabsTrigger value="pay" className="min-h-[44px] gap-2"><Wallet className="h-4 w-4" />{L.tabPay}</TabsTrigger>
        </TabsList>

        {/* ---------------- expenses ---------------- */}
        <TabsContent value="exp">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
            <select className={field} value={eCat} onChange={(e) => { setECat(e.target.value); setEPage(1) }}>
              <option value="">{L.allCats}</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" className={field} title={L.from} value={eFrom} onChange={(e) => { setEFrom(e.target.value); setEPage(1) }} />
            <input type="date" className={field} title={L.to} value={eTo} onChange={(e) => { setETo(e.target.value); setEPage(1) }} />
            <Button className="min-h-[40px]" onClick={() => openExp('new')}><Plus className="me-2 h-4 w-4" />{L.addExp}</Button>
          </div>
          {eLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : eItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
          ) : (
            <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{L.category}</th><th className={th}>{L.description}</th><th className={th}>{L.amount}</th>
                    <th className={th}>{L.inSyp}</th><th className={th}>{L.date}</th><th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {eItems.map((x) => (
                    <tr key={x.id}>
                      <td className={td}><Pill tone="blue">{x.category}</Pill></td>
                      <td className={td}>{x.description}<BranchBadge ids={x.branchId} /></td>
                      <td className={td}><span className="tnum" dir="ltr">{money(x.currency, x.amount)}</span>
                        {x.currency === 'Usd' && x.exchangeRate && <div className="tnum text-[11px] text-muted-foreground">x {n0(x.exchangeRate)}</div>}
                      </td>
                      <td className={td}><span className="tnum">{n0(x.amountInSyp)}</span></td>
                      <td className={td}><span className="tnum">{x.expenseDate.slice(0, 10)}</span></td>
                      <td className={td}>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openExp(x)}><Pencil className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-2 text-center text-xs text-muted-foreground">{L.noDelete}</div>
          <div className="mt-3 flex items-center justify-center gap-3 text-sm">
            <Button variant="outline" size="sm" disabled={ePage <= 1} onClick={() => setEPage(ePage - 1)}>{L.prev}</Button>
            <span className="tnum">{L.page} {ePage} / {pagesOf(eTotal)}</span>
            <Button variant="outline" size="sm" disabled={ePage >= pagesOf(eTotal)} onClick={() => setEPage(ePage + 1)}>{L.next}</Button>
          </div>
        </TabsContent>

        {/* ---------------- payroll ---------------- */}
        <TabsContent value="pay">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select className={field} value={pTrainer} onChange={(e) => { setPTrainer(e.target.value); setPPage(1) }}>
              <option value="">{L.allTrainers}</option>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
            <select className={field} value={pStatus} onChange={(e) => { setPStatus(e.target.value as PayrollStatus | ''); setPPage(1) }}>
              <option value="">{L.allStatus}</option>
              {(Object.keys(ST_AR) as PayrollStatus[]).map((k) => <option key={k} value={k}>{ST_AR[k]}</option>)}
            </select>
            <Button className="min-h-[40px]" onClick={openCalc}><Calculator className="me-2 h-4 w-4" />{L.calc}</Button>
          </div>
          {pLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : pItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
          ) : (
            <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{L.trainer}</th><th className={th}>{L.period}</th><th className={th}>{L.method}</th>
                    <th className={th}>{L.amount}</th><th className={th}>{L.inSyp}</th><th className={th}>{L.status}</th><th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {pItems.map((p) => (
                    <tr key={p.id}>
                      <td className={td}><b>{p.trainerName}</b><BranchBadge ids={p.branchId} /></td>
                      <td className={td}><span className="tnum">{p.periodStart.slice(0, 10)}<br />{p.periodEnd.slice(0, 10)}</span></td>
                      <td className={td}><span className="text-xs text-muted-foreground" dir="ltr">{p.calculationMethod}</span></td>
                      <td className={td}><span className="tnum" dir="ltr">{money(p.currency, p.amount)}</span></td>
                      <td className={td}><span className="tnum">{n0(p.amountInSyp)}</span></td>
                      <td className={td}>
                        <Pill tone={ST_TONE[p.status]}>{ST_AR[p.status]}</Pill>
                        {p.paidAt && <div className="tnum mt-1 text-[11px] text-muted-foreground">{p.paidAt.slice(0, 10)}</div>}
                      </td>
                      <td className={td}>
                        {p.status === 'Due' && (
                          <div className="flex flex-wrap gap-1">
                            <Button size="sm" onClick={() => { setPayFor(p); setPayRate('') }}>{L.pay}</Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => { setCancelFor(p); setReason('') }}>{L.cancelPay}</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-3 text-sm">
            <Button variant="outline" size="sm" disabled={pPage <= 1} onClick={() => setPPage(pPage - 1)}>{L.prev}</Button>
            <span className="tnum">{L.page} {pPage} / {pagesOf(pTotal)}</span>
            <Button variant="outline" size="sm" disabled={pPage >= pagesOf(pTotal)} onClick={() => setPPage(pPage + 1)}>{L.next}</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* expense dialog */}
      <Dialog open={expDlg !== null} onOpenChange={(o) => { if (!o) setExpDlg(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{expDlg === 'new' ? L.addExp : L.editExp}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <input className={field} list="exp-cats" placeholder={L.catHint} value={xCat} onChange={(e) => setXCat(e.target.value)} />
            <datalist id="exp-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
            <input className={field} placeholder={L.description} value={xDesc} onChange={(e) => setXDesc(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <select className={field} value={xCur} onChange={(e) => setXCur(e.target.value as Currency)}>
                <option value="Syp">{L.syp}</option>
                <option value="Usd">{L.usd}</option>
              </select>
              <input type="number" min={0} dir="ltr" className={field} placeholder={L.amount} value={xAmt} onChange={(e) => setXAmt(e.target.value)} />
            </div>
            {xCur === 'Usd' && <input type="number" min={0} dir="ltr" className={field} placeholder={L.rate} value={xRate} onChange={(e) => setXRate(e.target.value)} />}
            <input type="date" className={field} value={xDate} onChange={(e) => setXDate(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExpDlg(null)}>{L.back}</Button>
            <Button disabled={busy || !expValid} onClick={saveExp}>{busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* calculate payroll dialog */}
      <Dialog open={calcOpen} onOpenChange={(o) => { if (!o) setCalcOpen(false) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.calcTitle}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <select className={field} value={cTrainer} onChange={(e) => { setCTrainer(e.target.value); setCalc(null) }}>
              <option value="">{L.pickTrainer}</option>
              {trainers.filter((t) => t.isActive).map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="mb-1 text-xs text-muted-foreground">{L.periodStart}</div><input type="date" className={field} value={cStart} onChange={(e) => { setCStart(e.target.value); setCalc(null) }} /></div>
              <div><div className="mb-1 text-xs text-muted-foreground">{L.periodEnd}</div><input type="date" className={field} value={cEnd} onChange={(e) => { setCEnd(e.target.value); setCalc(null) }} /></div>
            </div>
            {calcNeedsRate && <input type="number" min={0} dir="ltr" className={field} placeholder={L.rate} value={cRate} onChange={(e) => { setCRate(e.target.value); setCalc(null) }} />}
          </div>
          {calc && (
            <div className="space-y-1 rounded-lg bg-muted/60 p-3 text-sm">
              <div className="text-xs text-muted-foreground">{L.previewNote}</div>
              <div dir="ltr" className="text-xs">{calc.calculationMethod}</div>
              {calc.monthsCovered !== null && <div>{L.months}: <b className="tnum">{calc.monthsCovered}</b></div>}
              {calc.hoursWorked !== null && <div>{L.hours}: <b className="tnum">{calc.hoursWorked}</b></div>}
              {calc.revenueCollectedInSyp !== null && <div>{L.revenue}: <b className="tnum">{n0(calc.revenueCollectedInSyp)}</b></div>}
              <div>{L.amount}: <b className="tnum" dir="ltr">{money(calc.currency, calc.amount)}</b> ({L.inSyp}: <b className="tnum">{n0(calc.amountInSyp)}</b>)</div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={busy || !calcValid} onClick={doPreview}>{L.preview}</Button>
            <Button disabled={busy || !calc} onClick={() => act(() => payrollApi.create(calcBody()), L.okCreate, () => setCalcOpen(false))}>{L.saveDue}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* pay dialog */}
      <Dialog open={!!payFor} onOpenChange={(o) => { if (!o) setPayFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.payTitle}</DialogTitle></DialogHeader>
          {payFor && <div className="text-sm"><b>{payFor.trainerName}</b> - <span className="tnum" dir="ltr">{money(payFor.currency, payFor.amount)}</span></div>}
          {payFor?.currency === 'Usd' && (
            <input type="number" min={0} dir="ltr" className={field} placeholder={L.newRate} value={payRate} onChange={(e) => setPayRate(e.target.value)} />
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayFor(null)}>{L.back}</Button>
            <Button disabled={busy}
              onClick={() => payFor && act(() => payrollApi.pay(payFor.id, payFor.currency === 'Usd' && Number(payRate) > 0 ? Number(payRate) : null), L.okPay, () => setPayFor(null))}>
              {L.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* cancel payroll dialog */}
      <Dialog open={!!cancelFor} onOpenChange={(o) => { if (!o) setCancelFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.cancelTitle}</DialogTitle></DialogHeader>
          {cancelFor && <div className="text-sm"><b>{cancelFor.trainerName}</b></div>}
          <input className={field} placeholder={L.reason} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelFor(null)}>{L.back}</Button>
            <Button variant="destructive" disabled={busy || !reason.trim()}
              onClick={() => cancelFor && act(() => payrollApi.cancel(cancelFor.id, reason.trim()), L.okCancel, () => setCancelFor(null))}>
              {L.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}