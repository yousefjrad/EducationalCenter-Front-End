import { useEffect, useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ApiError } from '@/services/api'
import { auditApi, type AuditLogDto } from '@/services/audit'

const L = {
  title: '\u0633\u062c\u0644 \u0627\u0644\u062a\u062f\u0642\u064a\u0642',
  subtitle: '\u0633\u062c\u0644 \u0644\u0644\u0642\u0631\u0627\u0621\u0629 \u0641\u0642\u0637 \u0644\u0643\u0644 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a \u0627\u0644\u0645\u0647\u0645\u0629',
  entity: '\u0627\u0644\u0643\u064a\u0627\u0646',
  branch: '\u0627\u0644\u0641\u0631\u0639',
  entityHint: '\u0627\u0644\u0643\u064a\u0627\u0646 (\u0645\u062b\u0644\u0627\u064b Payment)',
  action: '\u0627\u0644\u0639\u0645\u0644\u064a\u0629',
  actionHint: '\u0627\u0644\u0639\u0645\u0644\u064a\u0629 (\u0645\u062b\u0644\u0627\u064b Create)',
  from: '\u0645\u0646 \u062a\u0627\u0631\u064a\u062e',
  to: '\u0625\u0644\u0649 \u062a\u0627\u0631\u064a\u062e',
  date: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
  user: '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
  reason: '\u0627\u0644\u0633\u0628\u0628',
  details: '\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644',
  before: '\u0642\u0628\u0644 \u0627\u0644\u062a\u063a\u064a\u064a\u0631',
  after: '\u0628\u0639\u062f \u0627\u0644\u062a\u063a\u064a\u064a\u0631',
  none: '\u0644\u0627 \u064a\u0648\u062c\u062f',
  close: '\u0625\u063a\u0644\u0627\u0642',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0633\u062c\u0644\u0627\u062a',
  prev: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  page: '\u0635\u0641\u062d\u0629',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
}

const PAGE_SIZE = 50
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const pagesOf = (t: number) => Math.max(1, Math.ceil(t / PAGE_SIZE))
const fmtDt = (s: string) => s.replace('T', ' ').slice(0, 19)
const tone = (a: string): 'green' | 'red' | 'blue' => {
  const x = a.toLowerCase()
  if (x.includes('create') || x.includes('issue') || x.includes('pay')) return 'green'
  if (x.includes('cancel') || x.includes('void') || x.includes('delete')) return 'red'
  return 'blue'
}
const pretty = (s: string | null) => {
  if (!s) return L.none
  try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s }
}

export default function Audit() {
  const [items, setItems] = useState<AuditLogDto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [fEntity, setFEntity] = useState('')
  const [fAction, setFAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<AuditLogDto | null>(null)

  useEffect(() => {
    const id = setTimeout(() => { setFEntity(entity.trim()); setFAction(action.trim()); setPage(1) }, 400)
    return () => clearTimeout(id)
  }, [entity, action])

  useEffect(() => {
    let alive = true
    setLoading(true)
    auditApi
      .list({ entityName: fEntity || undefined, action: fAction || undefined, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) { setItems(r.items); setTotal(r.totalCount ?? r.total ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(e instanceof ApiError ? e.message : L.err) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [fEntity, fAction, from, to, page])

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input className={field} list="audit-entities" placeholder={L.entityHint} value={entity} onChange={(e) => setEntity(e.target.value)} />
        <datalist id="audit-entities">
          <option value="Payment" /><option value="Expense" /><option value="TrainerPayroll" /><option value="Certificate" /><option value="Course" /><option value="Room" /><option value="Section" /><option value="Student" /><option value="Branch" /><option value="Budget" />
        </datalist>
        <input className={field} placeholder={L.actionHint} value={action} onChange={(e) => setAction(e.target.value)} />
        <input type="date" className={field} title={L.from} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
        <input type="date" className={field} title={L.to} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{L.date}</th><th className={th}>{L.user}</th><th className={th}>{L.action}</th>
                <th className={th}>{L.entity}</th><th className={th}>{L.branch}</th><th className={th}>{L.reason}</th><th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-muted/40">
                  <td className={td}><span className="tnum whitespace-nowrap text-xs text-muted-foreground" dir="ltr">{fmtDt(a.createdAt)}</span></td>
                  <td className={td}><b>{a.userName}</b></td>
                  <td className={td}><Pill tone={tone(a.action)}>{a.action}</Pill></td>
                  <td className={td}><span className="text-xs text-muted-foreground" dir="ltr">{a.entityName} #{a.entityId}</span></td>
                  <td className={td}><span className="text-sm">{a.branchName ?? '-'}</span></td>
                  <td className={td}><span className="text-sm">{a.reason ?? '-'}</span></td>
                  <td className={td}>
                    <Button variant="ghost" size="icon" className="h-9 w-9" title={L.details} onClick={() => setView(a)}><Eye className="h-4 w-4" /></Button>
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

      <Dialog open={!!view} onOpenChange={(o) => { if (!o) setView(null) }}>
        <DialogContent className="scrollbar-thin max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{L.details}</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={tone(view.action)}>{view.action}</Pill>
                <span dir="ltr" className="text-xs text-muted-foreground">{view.entityName} #{view.entityId}</span>
                <span dir="ltr" className="tnum text-xs text-muted-foreground">{fmtDt(view.createdAt)}</span>
              </div>
              {view.reason && <div><b>{L.reason}:</b> {view.reason}</div>}
              <div>
                <div className="mb-1 text-xs font-bold text-muted-foreground">{L.before}</div>
                <pre dir="ltr" className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs">{pretty(view.oldValues)}</pre>
              </div>
              <div>
                <div className="mb-1 text-xs font-bold text-muted-foreground">{L.after}</div>
                <pre dir="ltr" className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs">{pretty(view.newValues)}</pre>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setView(null)}>{L.close}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}