import { useMemo, useState } from 'react'
import { ReceiptText, Plus, Pencil, Trash2, Calculator, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { useStore, monthlyRevenue, monthlyExpenses, monthlyPayroll } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import type { Expense, Trainer, TrainerPayroll } from '@/types'
import { fmtDate, fmtSYP, monthKey, monthLabel, todayISO } from '@/lib/format'
import { PageHeader, EmptyState, Pill, Field, TableScroll, Th, Td, Money, Card, CardContent, CardHeader, CardTitle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const CATS: Expense['category'][] = ['rent', 'utilities', 'supplies', 'maintenance', 'other']
const catTone: Record<Expense['category'], 'blue' | 'amber' | 'purple' | 'red' | 'gray'> = {
  rent: 'blue', utilities: 'amber', supplies: 'purple', maintenance: 'red', other: 'gray',
}

/** payroll computation per trainer for a month */
export function computeTrainerPayroll(state: ReturnType<typeof import('@/store/AppStore').useStore>['state'], trainer: Trainer, ym: string): Omit<TrainerPayroll, 'id'> | null {
  const mySections = state.sections.filter((s) => s.trainerId === trainer.id && s.status !== 'cancelled')
  if (trainer.payrollType === 'fixed') {
    if (!trainer.fixedSalary) return null
    return { trainerId: trainer.id, month: ym, amount: trainer.fixedSalary, details: 'راتب شهري ثابت', status: 'due' }
  }
  if (trainer.payrollType === 'hourly') {
    const sessions = state.sessions.filter(
      (s) => s.status === 'held' && s.date.startsWith(ym) && mySections.some((x) => x.id === s.sectionId),
    )
    const hours = sessions.reduce((a, s) => {
      const [h1, m1] = s.start.split(':').map(Number)
      const [h2, m2] = s.end.split(':').map(Number)
      return a + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60
    }, 0)
    if (hours === 0) return null
    return {
      trainerId: trainer.id, month: ym,
      amount: Math.round(hours * (trainer.hourlyRate ?? 0)),
      details: `${hours.toFixed(1)} ساعة × ${fmtSYP(trainer.hourlyRate ?? 0)}`,
      status: 'due',
    }
  }
  // percentage of revenue collected from their sections this month
  const enrollIds = state.enrollments.filter((e) => mySections.some((s) => s.id === e.sectionId)).map((e) => e.id)
  const revenue = state.payments.filter((p) => !p.voided && p.date.startsWith(ym) && enrollIds.includes(p.enrollmentId)).reduce((a, p) => a + p.amountSYP, 0)
  if (revenue === 0) return null
  return {
    trainerId: trainer.id, month: ym,
    amount: Math.round((revenue * (trainer.percentage ?? 0)) / 100),
    details: `${trainer.percentage}% من إيراد محصّل ${fmtSYP(revenue)}`,
    status: 'due',
  }
}

export default function Expenses() {
  const { t, lang } = useI18n()
  const { state, dispatch } = useStore()
  const [editExp, setEditExp] = useState<Expense | 'new' | null>(null)
  const [payMonth, setPayMonth] = useState(monthKey(todayISO()))

  const expenses = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date))
  const payrollRows = state.payroll.filter((p) => p.month === payMonth)

  // last 6 months profit table
  const profitRows = useMemo(() => {
    const out = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const ym = monthKey(d.toISOString().slice(0, 10))
      const revenue = monthlyRevenue(state, ym)
      const exp = monthlyExpenses(state, ym)
      const sal = monthlyPayroll(state, ym)
      out.push({ ym, revenue, exp, sal, net: revenue - exp - sal })
    }
    return out
  }, [state])

  const generatePayroll = () => {
    if (state.payroll.some((p) => p.month === payMonth)) { toast.error(t('payroll.already')); return }
    const rows = state.trainers.filter((x) => x.active).map((x) => computeTrainerPayroll(state, x, payMonth)).filter((r): r is Omit<TrainerPayroll, 'id'> => r !== null)
    if (rows.length === 0) { toast.error(t('common.noResults')); return }
    dispatch({ type: 'SET_PAYROLL', month: payMonth, rows })
    toast.success(t('payroll.generated'))
  }

  return (
    <div>
      <PageHeader title={t('exp.title')} subtitle={t('exp.subtitle')} />

      <Tabs defaultValue="expenses">
        <TabsList className="mb-4">
          <TabsTrigger value="expenses" className="min-h-[44px]">{t('exp.tab.expenses')}</TabsTrigger>
          <TabsTrigger value="payroll" className="min-h-[44px]">{t('exp.tab.payroll')}</TabsTrigger>
          <TabsTrigger value="profit" className="min-h-[44px]">{t('exp.tab.profit')}</TabsTrigger>
        </TabsList>

        {/* ---------- expenses ---------- */}
        <TabsContent value="expenses">
          <div className="mb-4 flex justify-end">
            <Button className="min-h-[44px]" onClick={() => setEditExp('new')}>
              <Plus className="me-2 h-4 w-4" />{t('exp.add')}
            </Button>
          </div>
          {expenses.length === 0 ? (
            <EmptyState message={t('exp.empty')} icon={<ReceiptText className="h-10 w-10" strokeWidth={1.2} />} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr><Th>{t('exp.title_')}</Th><Th>{t('exp.category')}</Th><Th>{t('common.amount')}</Th><Th>{t('common.date')}</Th><Th>{t('common.notes')}</Th><Th></Th></tr>
                </thead>
                <tbody>
                  {expenses.map((x) => (
                    <tr key={x.id} className="border-b last:border-0 hover:bg-muted/40">
                      <Td className="font-bold">{x.title}</Td>
                      <Td><Pill tone={catTone[x.category]}>{t(`exp.cat.${x.category}`)}</Pill></Td>
                      <Td><Money amount={x.amount} /></Td>
                      <Td><span className="tnum text-muted-foreground">{fmtDate(x.date)}</span></Td>
                      <Td className="max-w-[220px]"><span className="line-clamp-1 text-xs text-muted-foreground">{x.notes ?? '—'}</span></Td>
                      <Td>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditExp(x)}><Pencil className="h-4 w-4" /></Button>
                          <Button
                            variant="ghost" size="icon" className="h-9 w-9 text-destructive"
                            onClick={() => { dispatch({ type: 'DELETE_EXPENSE', id: x.id }); toast.success(t('common.deleted')) }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </TabsContent>

        {/* ---------- payroll ---------- */}
        <TabsContent value="payroll">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input type="month" dir="ltr" className="min-h-[44px] w-[180px]" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} />
            <Button className="min-h-[44px]" onClick={generatePayroll}>
              <Calculator className="me-2 h-4 w-4" />{t('payroll.generate')}
            </Button>
          </div>
          {payrollRows.length === 0 ? (
            <EmptyState message={t('exp.empty')} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr><Th>{t('common.trainer')}</Th><Th>{t('common.details')}</Th><Th>{t('common.amount')}</Th><Th>{t('common.status')}</Th><Th></Th></tr>
                </thead>
                <tbody>
                  {payrollRows.map((p) => {
                    const trainer = state.trainers.find((x) => x.id === p.trainerId)
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                        <Td className="font-bold">{trainer?.name}</Td>
                        <Td className="text-muted-foreground">{p.details}</Td>
                        <Td><Money amount={p.amount} /></Td>
                        <Td>
                          {p.status === 'paid'
                            ? <Pill tone="green">{t('payroll.status.paid')} {p.paidAt && <span className="tnum">· {fmtDate(p.paidAt)}</span>}</Pill>
                            : <Pill tone="amber">{t('payroll.status.due')}</Pill>}
                        </Td>
                        <Td>
                          {p.status === 'due' && (
                            <Button size="sm" className="min-h-[36px]" onClick={() => { dispatch({ type: 'MARK_PAYROLL_PAID', id: p.id }); toast.success(t('payroll.paid')) }}>
                              <CheckCircle2 className="me-1 h-3.5 w-3.5" />{t('payroll.markPaid')}
                            </Button>
                          )}
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableScroll>
          )}
        </TabsContent>

        {/* ---------- net profit ---------- */}
        <TabsContent value="profit">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(() => {
              const ym = monthKey(todayISO())
              const rev = monthlyRevenue(state, ym), exp = monthlyExpenses(state, ym), sal = monthlyPayroll(state, ym)
              const net = rev - exp - sal
              return (
                <>
                  <Card className="shadow-sm"><CardContent className="p-5"><div className="text-sm text-muted-foreground">{t('profit.revenue')}</div><div className="tnum mt-1 text-xl font-extrabold text-[hsl(var(--success))]">{fmtSYP(rev, lang)}</div></CardContent></Card>
                  <Card className="shadow-sm"><CardContent className="p-5"><div className="text-sm text-muted-foreground">{t('profit.expenses')}</div><div className="tnum mt-1 text-xl font-extrabold text-destructive">{fmtSYP(exp, lang)}</div></CardContent></Card>
                  <Card className="shadow-sm"><CardContent className="p-5"><div className="text-sm text-muted-foreground">{t('profit.salaries')}</div><div className="tnum mt-1 text-xl font-extrabold text-destructive">{fmtSYP(sal, lang)}</div></CardContent></Card>
                  <Card className="shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-1 text-sm text-muted-foreground">{net >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-destructive" />}{t(net >= 0 ? 'profit.net' : 'profit.loss')}</div><div className={cn('tnum mt-1 text-xl font-extrabold', net >= 0 ? 'text-primary' : 'text-destructive')}>{fmtSYP(Math.abs(net), lang)}</div></CardContent></Card>
                </>
              )
            })()}
          </div>

          <Card className="mt-5 shadow-sm">
            <CardHeader><CardTitle className="text-base font-extrabold">{t('exp.tab.profit')} — {t('dash.last6')}</CardTitle></CardHeader>
            <CardContent>
              <TableScroll>
                <table className="w-full min-w-[640px] border-0 shadow-none">
                  <thead>
                    <tr><Th>{t('common.month')}</Th><Th>{t('profit.revenue')}</Th><Th>{t('profit.expenses')}</Th><Th>{t('profit.salaries')}</Th><Th>{t('profit.net')}</Th></tr>
                  </thead>
                  <tbody>
                    {profitRows.map((r) => (
                      <tr key={r.ym} className="border-b last:border-0">
                        <Td className="font-bold">{monthLabel(r.ym, lang)}</Td>
                        <Td><Money amount={r.revenue} className="text-[hsl(var(--success))]" /></Td>
                        <Td><Money amount={r.exp} className="text-muted-foreground" /></Td>
                        <Td><Money amount={r.sal} className="text-muted-foreground" /></Td>
                        <Td><Money amount={r.net} className={r.net >= 0 ? 'text-primary' : 'text-destructive'} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* expense dialog */}
      <ExpenseDialog target={editExp} onClose={() => setEditExp(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------

function ExpenseDialog({ target, onClose }: { target: Expense | 'new' | null; onClose: () => void }) {
  const { t } = useI18n()
  const { dispatch } = useStore()
  const editing = target !== 'new' ? target : null
  const [title, setTitle] = useState(editing?.title ?? '')
  const [category, setCategory] = useState<Expense['category']>(editing?.category ?? 'other')
  const [amount, setAmount] = useState(editing?.amount.toString() ?? '')
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [notes, setNotes] = useState(editing?.notes ?? '')

  const save = () => {
    if (!title.trim() || !(Number(amount) > 0)) { toast.error(t('common.required')); return }
    dispatch({
      type: 'SAVE_EXPENSE',
      expense: { id: editing?.id ?? 0, title: title.trim(), category, amount: Number(amount), date, notes: notes.trim() || undefined },
    })
    toast.success(t('common.saved'))
    onClose()
  }

  return (
    <Dialog open={target !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? t('exp.edit') : t('exp.add')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label={t('exp.title_')} required>
            <Input className="min-h-[44px]" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('exp.category')}>
              <Select value={category} onValueChange={(v) => setCategory(v as Expense['category'])}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => <SelectItem key={c} value={c}>{t(`exp.cat.${c}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('common.amount')} required>
              <Input type="number" dir="ltr" className="min-h-[44px]" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          </div>
          <Field label={t('common.date')}>
            <Input type="date" dir="ltr" className="min-h-[44px]" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t('common.notes')}>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
