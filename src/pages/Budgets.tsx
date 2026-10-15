import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ApiError } from '@/services/api'
import { useAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { budgetsApi, type BudgetDto, type BudgetStatus } from '@/services/budgets'

const L = {
  title: '\u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0627\u062a \u0627\u0644\u0634\u0647\u0631\u064a\u0629',
  subtitle: '\u064a\u0637\u0644\u0628 \u0645\u062f\u064a\u0631 \u0627\u0644\u0641\u0631\u0639 \u0645\u064a\u0632\u0627\u0646\u064a\u0629 \u0643\u0644 \u0634\u0647\u0631\u060c \u0648\u064a\u0639\u062a\u0645\u062f\u0647\u0627 \u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0627\u0645. \u062a\u062c\u0627\u0648\u0632 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629 \u062a\u0646\u0628\u064a\u0647 \u0641\u0642\u0637 \u0648\u0644\u0627 \u064a\u0645\u0646\u0639 \u0623\u064a \u0645\u0635\u0631\u0648\u0641.',
  add: '\u0637\u0644\u0628 \u0645\u064a\u0632\u0627\u0646\u064a\u0629',
  edit: '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629',
  month: '\u0627\u0644\u0634\u0647\u0631',
  branch: '\u0627\u0644\u0641\u0631\u0639',
  requested: '\u0627\u0644\u0645\u0637\u0644\u0648\u0628',
  approved: '\u0627\u0644\u0645\u0639\u062a\u0645\u062f',
  spent: '\u0627\u0644\u0645\u0635\u0631\u0648\u0641',
  remaining: '\u0627\u0644\u0645\u062a\u0628\u0642\u064a',
  status: '\u0627\u0644\u062d\u0627\u0644\u0629',
  notes: '\u0645\u0644\u0627\u062d\u0638\u0627\u062a',
  amount: '\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0637\u0644\u0648\u0628 (\u0644\u064a\u0631\u0629)',
  allStatus: '\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
  over: '\u062a\u062c\u0627\u0648\u0632 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u064a\u0632\u0627\u0646\u064a\u0627\u062a',
  save: '\u062d\u0641\u0638',
  back: '\u0631\u062c\u0648\u0639',
  saved: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638',
  confirm: '\u062a\u0623\u0643\u064a\u062f',
  submit: '\u0625\u0631\u0633\u0627\u0644 \u0644\u0644\u0627\u0639\u062a\u0645\u0627\u062f',
  submitted: '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629 \u0644\u0644\u0627\u0639\u062a\u0645\u0627\u062f',
  approve: '\u0627\u0639\u062a\u0645\u0627\u062f',
  approveTitle: '\u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629',
  approveAmount: '\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0639\u062a\u0645\u062f (\u0627\u062a\u0631\u0643\u0647 \u0643\u0645\u0627 \u0647\u0648 \u0644\u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0645\u0637\u0644\u0648\u0628)',
  approvedOk: '\u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629',
  reject: '\u0631\u0641\u0636',
  rejectTitle: '\u0631\u0641\u0636 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629',
  reason: '\u0633\u0628\u0628 \u0627\u0644\u0631\u0641\u0636 (\u0645\u0637\u0644\u0648\u0628)',
  rejectedOk: '\u062a\u0645 \u0631\u0641\u0636 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629',
  pickBranch: '\u0627\u062e\u062a\u0631 \u0641\u0631\u0639\u0627\u064b \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649 \u0644\u062a\u062a\u0645\u0643\u0646 \u0645\u0646 \u0637\u0644\u0628 \u0645\u064a\u0632\u0627\u0646\u064a\u0629 \u0644\u0647.',
  editNote: '\u0628\u0639\u062f \u062a\u0639\u062f\u064a\u0644 \u0645\u064a\u0632\u0627\u0646\u064a\u0629 \u0645\u0631\u0641\u0648\u0636\u0629 \u062a\u0639\u0648\u062f \u0645\u0633\u0648\u062f\u0629\u060c \u062b\u0645 \u0623\u0631\u0633\u0644\u0647\u0627 \u0644\u0644\u0627\u0639\u062a\u0645\u0627\u062f \u0645\u0646 \u062c\u062f\u064a\u062f.',
  prev: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  page: '\u0635\u0641\u062d\u0629',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
  Draft: '\u0645\u0633\u0648\u062f\u0629',
  Submitted: '\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f',
  Approved: '\u0645\u0639\u062a\u0645\u062f\u0629',
  Rejected: '\u0645\u0631\u0641\u0648\u0636\u0629',
}

const ST_AR: Record<BudgetStatus, string> = { Draft: L.Draft, Submitted: L.Submitted, Approved: L.Approved, Rejected: L.Rejected }
const ST_TONE: Record<BudgetStatus, 'gray' | 'amber' | 'green' | 'red'> = { Draft: 'gray', Submitted: 'amber', Approved: 'green', Rejected: 'red' }
const ST_ORDER: BudgetStatus[] = ['Draft', 'Submitted', 'Approved', 'Rejected']

const PAGE_SIZE = 20
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const pagesOf = (t: number) => Math.max(1, Math.ceil(t / PAGE_SIZE))
const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const stOf = (s: BudgetDto['status'] | number): BudgetStatus =>
  typeof s === 'number' ? ST_ORDER[s] ?? 'Draft' : s

export default function Budgets() {
  const { isSuperAdmin, activeBranchId } = useAuth()
  const canRequest = hasPermission('Budgets.Request')
  const canApprove = hasPermission('Budgets.Approve')
  const needBranch = isSuperAdmin && !activeBranchId

  const [items, setItems] = useState<BudgetDto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<BudgetStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState<BudgetDto | 'new' | null>(null)
  const [fMonth, setFMonth] = useState(currentMonth())
  const [fAmt, setFAmt] = useState('')
  const [fNotes, setFNotes] = useState('')

  const [approveFor, setApproveFor] = useState<BudgetDto | null>(null)
  const [aAmt, setAAmt] = useState('')
  const [rejectFor, setRejectFor] = useState<BudgetDto | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    budgetsApi.list({ status: status || undefined, page, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) { setItems(r.items); setTotal(r.totalCount ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [status, page, reloadKey])

  const act = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
      after?.()
      setReloadKey((k) => k + 1)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const openForm = (b: BudgetDto | 'new') => {
    setForm(b)
    if (b === 'new') { setFMonth(currentMonth()); setFAmt(''); setFNotes('') }
    else { setFMonth(b.month.slice(0, 7)); setFAmt(String(b.requestedAmountSyp)); setFNotes(stOf(b.status) === 'Rejected' ? '' : (b.notes ?? '')) }
  }
  const formValid = Number(fAmt) > 0 && !!fMonth
  const saveForm = () =>
    act(
      () => (form === 'new' || form === null
        ? budgetsApi.create({ month: fMonth + '-01', requestedAmountSyp: Number(fAmt), notes: fNotes.trim() || null })
        : budgetsApi.update(form.id, { requestedAmountSyp: Number(fAmt), notes: fNotes.trim() || null })),
      L.saved,
      () => setForm(null),
    )

  return (
    <div>
      <PageHeader
        title={L.title}
        subtitle={L.subtitle}
        actions={canRequest ? (
          <Button className="min-h-[44px]" disabled={needBranch} onClick={() => openForm('new')}>
            <Plus className="me-2 h-4 w-4" />{L.add}
          </Button>
        ) : undefined}
      />
      {canRequest && needBranch && <div className="mb-3 text-sm text-muted-foreground">{L.pickBranch}</div>}

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <select className={field} value={status} onChange={(e) => { setStatus(e.target.value as BudgetStatus | ''); setPage(1) }}>
          <option value="">{L.allStatus}</option>
          {ST_ORDER.map((k) => <option key={k} value={k}>{ST_AR[k]}</option>)}
        </select>
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
                <th className={th}>{L.branch}</th><th className={th}>{L.month}</th><th className={th}>{L.requested}</th>
                <th className={th}>{L.approved}</th><th className={th}>{L.spent}</th><th className={th}>{L.remaining}</th>
                <th className={th}>{L.status}</th><th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const st = stOf(b.status)
                const over = b.remainingSyp !== null && b.remainingSyp < 0
                return (
                  <tr key={b.id}>
                    <td className={td}><b>{b.branchName}</b></td>
                    <td className={td}><span className="tnum">{b.month.slice(0, 7)}</span></td>
                    <td className={td}><span className="tnum">{n0(b.requestedAmountSyp)}</span></td>
                    <td className={td}><span className="tnum">{b.approvedAmountSyp === null ? '-' : n0(b.approvedAmountSyp)}</span></td>
                    <td className={td}><span className="tnum">{n0(b.spentSyp)}</span></td>
                    <td className={td}>
                      {b.remainingSyp === null ? '-' : (
                        <span className={over ? 'tnum font-bold text-destructive' : 'tnum'} dir="ltr">{n0(b.remainingSyp)}</span>
                      )}
                      {over && <div><Pill tone="red">{L.over}</Pill></div>}
                    </td>
                    <td className={td}>
                      <Pill tone={ST_TONE[st]}>{ST_AR[st]}</Pill>
                      {b.notes && <div className="mt-1 max-w-[220px] text-[11px] text-muted-foreground">{b.notes}</div>}
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap items-center gap-1">
                        {canRequest && (st === 'Draft' || st === 'Rejected') && (
                          <>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openForm(b)}><Pencil className="h-4 w-4" /></Button>
                            {st === 'Draft' && (
                              <Button size="sm" disabled={busy} onClick={() => act(() => budgetsApi.submit(b.id), L.submitted)}>{L.submit}</Button>
                            )}
                          </>
                        )}
                        {canApprove && st === 'Submitted' && (
                          <>
                            <Button size="sm" onClick={() => { setApproveFor(b); setAAmt(String(b.requestedAmountSyp)) }}>{L.approve}</Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => { setRejectFor(b); setReason('') }}>{L.reject}</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{L.prev}</Button>
        <span className="tnum">{L.page} {page} / {pagesOf(total)}</span>
        <Button variant="outline" size="sm" disabled={page >= pagesOf(total)} onClick={() => setPage(page + 1)}>{L.next}</Button>
      </div>

      {/* request / edit */}
      <Dialog open={form !== null} onOpenChange={(o) => { if (!o) setForm(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form === 'new' ? L.add : L.edit}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{L.month}</div>
              <input type="month" className={field} value={fMonth} min={currentMonth()} disabled={form !== 'new'} onChange={(e) => setFMonth(e.target.value)} />
            </div>
            <input type="number" min={0} dir="ltr" className={field} placeholder={L.amount} value={fAmt} onChange={(e) => setFAmt(e.target.value)} />
            <input className={field} placeholder={L.notes} maxLength={300} value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
            {form !== 'new' && form !== null && stOf(form.status) === 'Rejected' && (
              <div className="text-xs text-muted-foreground">{L.editNote}</div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setForm(null)}>{L.back}</Button>
            <Button disabled={busy || !formValid} onClick={saveForm}>{busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* approve */}
      <Dialog open={!!approveFor} onOpenChange={(o) => { if (!o) setApproveFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.approveTitle}</DialogTitle></DialogHeader>
          {approveFor && (
            <div className="text-sm">
              <b>{approveFor.branchName}</b> - <span className="tnum">{approveFor.month.slice(0, 7)}</span>
              <div className="mt-1 text-xs text-muted-foreground">{L.requested}: <span className="tnum">{n0(approveFor.requestedAmountSyp)}</span></div>
            </div>
          )}
          <input type="number" min={0} dir="ltr" className={field} placeholder={L.approveAmount} value={aAmt} onChange={(e) => setAAmt(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveFor(null)}>{L.back}</Button>
            <Button
              disabled={busy || !(Number(aAmt) > 0)}
              onClick={() => approveFor && act(() => budgetsApi.approve(approveFor.id, Number(aAmt)), L.approvedOk, () => setApproveFor(null))}
            >{L.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* reject */}
      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o) setRejectFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.rejectTitle}</DialogTitle></DialogHeader>
          {rejectFor && <div className="text-sm"><b>{rejectFor.branchName}</b> - <span className="tnum">{rejectFor.month.slice(0, 7)}</span></div>}
          <input className={field} placeholder={L.reason} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectFor(null)}>{L.back}</Button>
            <Button
              variant="destructive" disabled={busy || !reason.trim()}
              onClick={() => rejectFor && act(() => budgetsApi.reject(rejectFor.id, reason.trim()), L.rejectedOk, () => setRejectFor(null))}
            >{L.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}