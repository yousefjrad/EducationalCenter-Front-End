import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Hourglass, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, ApiError } from '@/services/api'
import {
  enrollmentsApi, waitingApi,
  type EnrollmentDto, type EnrollmentStatus, type WaitingEntryDto, type WaitingStatus,
} from '@/services/enrollments'

const L = {
  title: '\u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a',
  subtitle: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0637\u0644\u0627\u0628 \u0641\u064a \u0627\u0644\u0634\u0639\u0628 \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062d\u062c\u0648\u0632\u0627\u062a \u0648\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
  tabEnroll: '\u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a',
  tabWait: '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
  add: '\u062a\u0633\u062c\u064a\u0644 \u0637\u0627\u0644\u0628',
  addWait: '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
  allStatus: '\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
  allSections: '\u0643\u0644 \u0627\u0644\u0634\u0639\u0628',
  student: '\u0627\u0644\u0637\u0627\u0644\u0628',
  section: '\u0627\u0644\u0634\u0639\u0628\u0629',
  price: '\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u062a\u0641\u0642',
  status: '\u0627\u0644\u062d\u0627\u0644\u0629',
  date: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
  hold: '\u064a\u0646\u062a\u0647\u064a \u0627\u0644\u062d\u062c\u0632',
  position: '\u0627\u0644\u062f\u0648\u0631',
  phone: '\u0627\u0644\u0647\u0627\u062a\u0641',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a',
  confirm: '\u062a\u0623\u0643\u064a\u062f',
  cancelEnroll: '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0633\u062c\u064a\u0644',
  transfer: '\u0646\u0642\u0644',
  promote: '\u062a\u0631\u0642\u064a\u0629',
  removeWait: '\u0625\u0632\u0627\u0644\u0629',
  close: '\u0625\u063a\u0644\u0627\u0642',
  back: '\u0631\u062c\u0648\u0639',
  prev: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  page: '\u0635\u0641\u062d\u0629',
  search: '\u0627\u0628\u062d\u062b \u0639\u0646 \u0637\u0627\u0644\u0628 \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0647\u0627\u062a\u0641\u2026',
  pickStudent: '\u0627\u062e\u062a\u0631 \u0627\u0644\u0637\u0627\u0644\u0628',
  pickSection: '\u0627\u062e\u062a\u0631 \u0627\u0644\u0634\u0639\u0628\u0629',
  asHold: '\u062d\u062c\u0632 \u0645\u0624\u0642\u062a (\u064a\u064f\u0644\u063a\u0649 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0628\u0639\u062f \u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0645\u062f\u0629)',
  enrollNow: '\u062a\u0633\u062c\u064a\u0644',
  enrollTitle: '\u062a\u0633\u062c\u064a\u0644 \u0637\u0627\u0644\u0628 \u0641\u064a \u0634\u0639\u0628\u0629',
  transferTitle: '\u0646\u0642\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u0625\u0644\u0649 \u0634\u0639\u0628\u0629 \u0623\u062e\u0631\u0649 (\u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0645\u0627\u062f\u0629)',
  targetSection: '\u0627\u0644\u0634\u0639\u0628\u0629 \u0627\u0644\u0647\u062f\u0641',
  promoteTitle: '\u062a\u0631\u0642\u064a\u0629 \u0645\u0646 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
  promoteAsHold: '\u062a\u0631\u0642\u064a\u0629 \u0643\u062d\u062c\u0632 \u0645\u0624\u0642\u062a \u0628\u062f\u0644 \u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0645\u0624\u0643\u062f',
  sure: '\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f\u061f',
  cancelEnrollBody: '\u0633\u064a\u064f\u062d\u0631\u064e\u0651\u0631 \u0627\u0644\u0645\u0642\u0639\u062f \u0648\u062a\u0628\u0642\u0649 \u0627\u0644\u0645\u0628\u0627\u0644\u063a \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0629 \u0645\u0633\u062c\u0644\u0629.',
  cancelWaitBody: '\u0633\u062a\u064f\u0632\u0627\u0644 \u0647\u0630\u0647 \u0627\u0644\u062d\u0627\u0644\u0629 \u0645\u0646 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631.',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
  okEnroll: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0637\u0627\u0644\u0628',
  okHold: '\u062a\u0645 \u062d\u062c\u0632 \u0645\u0642\u0639\u062f \u0645\u0624\u0642\u062a \u0644\u0644\u0637\u0627\u0644\u0628',
  okConfirm: '\u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062a\u0633\u062c\u064a\u0644',
  okCancel: '\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0633\u062c\u064a\u0644',
  okTransfer: '\u062a\u0645 \u0646\u0642\u0644 \u0627\u0644\u0637\u0627\u0644\u0628',
  okWait: '\u0623\u064f\u0636\u064a\u0641 \u0627\u0644\u0637\u0627\u0644\u0628 \u0625\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
  okPromote: '\u062a\u0645\u062a \u0627\u0644\u062a\u0631\u0642\u064a\u0629',
  okRemove: '\u062a\u0645\u062a \u0627\u0644\u0625\u0632\u0627\u0644\u0629',
}

const ST_AR: Record<EnrollmentStatus, string> = {
  Pending: '\u062d\u062c\u0632 \u0645\u0624\u0642\u062a', Confirmed: '\u0645\u0633\u062c\u0644', Cancelled: '\u0645\u0644\u063a\u0649', Transferred: '\u0645\u0646\u0642\u0648\u0644', Completed: '\u0645\u0643\u062a\u0645\u0644',
}
const ST_TONE: Record<EnrollmentStatus, 'amber' | 'green' | 'red' | 'gray' | 'teal'> = {
  Pending: 'amber', Confirmed: 'green', Cancelled: 'red', Transferred: 'gray', Completed: 'teal',
}
const WT_AR: Record<WaitingStatus, string> = { Waiting: '\u0641\u064a \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631', Promoted: '\u062a\u0645\u062a \u0627\u0644\u062a\u0631\u0642\u064a\u0629', Cancelled: '\u0645\u0644\u063a\u0649' }
const WT_TONE: Record<WaitingStatus, 'amber' | 'green' | 'red'> = { Waiting: 'amber', Promoted: 'green', Cancelled: 'red' }

interface SectionLite { id: number; name: string; status: string; courseId?: number }
interface StudentLite { id: number; fullName: string; phoneNumber: string; isActive: boolean }

const PAGE_SIZE = 20
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const d10 = (s: string) => s.slice(0, 10)
const d16 = (s: string) => s.slice(0, 16).replace('T', ' ')
const pagesOf = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE))

interface ConfirmState { title: string; body: string; run: () => Promise<unknown>; ok: string }

export default function Enrollments() {
  const [tab, setTab] = useState('enroll')
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  const [sections, setSections] = useState<SectionLite[]>([])
  const [students, setStudents] = useState<StudentLite[]>([])

  // enrollments list
  const [eItems, setEItems] = useState<EnrollmentDto[]>([])
  const [eTotal, setETotal] = useState(0)
  const [ePage, setEPage] = useState(1)
  const [eStatus, setEStatus] = useState<EnrollmentStatus | ''>('')
  const [eSection, setESection] = useState('')
  const [eLoading, setELoading] = useState(true)

  // waiting list
  const [wItems, setWItems] = useState<WaitingEntryDto[]>([])
  const [wTotal, setWTotal] = useState(0)
  const [wPage, setWPage] = useState(1)
  const [wStatus, setWStatus] = useState<WaitingStatus | ''>('Waiting')
  const [wSection, setWSection] = useState('')
  const [wLoading, setWLoading] = useState(true)

  // dialogs
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [stFilter, setStFilter] = useState('')
  const [stId, setStId] = useState('')
  const [secId, setSecId] = useState('')
  const [asHold, setAsHold] = useState(false)
  const [transferFor, setTransferFor] = useState<EnrollmentDto | null>(null)
  const [targetId, setTargetId] = useState('')
  const [promoteFor, setPromoteFor] = useState<WaitingEntryDto | null>(null)
  const [promoteHold, setPromoteHold] = useState(false)
  const [confirmSt, setConfirmSt] = useState<ConfirmState | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(api.get('/sections?pageSize=100') as Promise<{ items: SectionLite[] }>)
      .then((r) => setSections(r.items))
      .catch(() => { /* ignore */ })
    ;(api.get('/students?pageSize=100') as Promise<{ items: StudentLite[] }>)
      .then((r) => setStudents(r.items))
      .catch(() => { /* ignore */ })
  }, [reloadKey])

  useEffect(() => {
    let alive = true
    setELoading(true)
    enrollmentsApi
      .list({ sectionId: eSection ? Number(eSection) : undefined, status: eStatus, page: ePage, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) { setEItems(r.items); setETotal(r.totalCount ?? r.total ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setELoading(false) })
    return () => { alive = false }
  }, [eSection, eStatus, ePage, reloadKey])

  useEffect(() => {
    let alive = true
    setWLoading(true)
    waitingApi
      .list({ sectionId: wSection ? Number(wSection) : undefined, status: wStatus, page: wPage, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) { setWItems(r.items); setWTotal(r.totalCount ?? r.total ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setWLoading(false) })
    return () => { alive = false }
  }, [wSection, wStatus, wPage, reloadKey])

  const openSections = useMemo(
    () => sections.filter((s) => s.status === 'OpenForEnrollment' || s.status === 'InProgress'),
    [sections],
  )
  const stOptions = useMemo(() => {
    const q = stFilter.trim().toLowerCase()
    return students
      .filter((s) => s.isActive && (!q || s.fullName.toLowerCase().includes(q) || (s.phoneNumber ?? '').includes(q)))
      .slice(0, 50)
  }, [students, stFilter])

  const transferOptions = useMemo(() => {
    if (!transferFor) return []
    const course = sections.find((s) => s.id === transferFor.sectionId)?.courseId
    return openSections.filter(
      (s) => s.id !== transferFor.sectionId && (course === undefined || s.courseId === undefined || s.courseId === course),
    )
  }, [transferFor, sections, openSections])

  const run = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
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

  const resetEnroll = () => { setEnrollOpen(false); setStFilter(''); setStId(''); setSecId(''); setAsHold(false) }

  const doEnroll = () =>
    run(() => enrollmentsApi.create({ studentId: Number(stId), sectionId: Number(secId), asHold }), asHold ? L.okHold : L.okEnroll, resetEnroll)
  const doAddWait = () =>
    run(() => waitingApi.add({ studentId: Number(stId), sectionId: Number(secId) }), L.okWait, resetEnroll)

  const Pager = ({ page, total, set }: { page: number; total: number; set: (n: number) => void }) => (
    <div className="mt-3 flex items-center justify-center gap-3 text-sm">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => set(page - 1)}>{L.prev}</Button>
      <span className="tnum">{L.page} {page} / {pagesOf(total)}</span>
      <Button variant="outline" size="sm" disabled={page >= pagesOf(total)} onClick={() => set(page + 1)}>{L.next}</Button>
    </div>
  )

  const Spinner = () => <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
  const td = 'border-b px-3 py-2.5 text-sm'

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button className="min-h-[44px]" onClick={() => setEnrollOpen(true)}><Plus className="me-2 h-4 w-4" />{L.add}</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="enroll" className="min-h-[44px] gap-2"><ClipboardList className="h-4 w-4" />{L.tabEnroll}</TabsTrigger>
          <TabsTrigger value="wait" className="min-h-[44px] gap-2"><Hourglass className="h-4 w-4" />{L.tabWait}</TabsTrigger>
        </TabsList>

        <TabsContent value="enroll">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select className={field} value={eStatus} onChange={(e) => { setEStatus(e.target.value as EnrollmentStatus | ''); setEPage(1) }}>
              <option value="">{L.allStatus}</option>
              {(Object.keys(ST_AR) as EnrollmentStatus[]).map((k) => <option key={k} value={k}>{ST_AR[k]}</option>)}
            </select>
            <select className={field} value={eSection} onChange={(e) => { setESection(e.target.value); setEPage(1) }}>
              <option value="">{L.allSections}</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {eLoading ? <Spinner /> : eItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
          ) : (
            <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{L.student}</th><th className={th}>{L.section}</th><th className={th}>{L.price}</th>
                    <th className={th}>{L.status}</th><th className={th}>{L.date}</th><th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {eItems.map((e) => (
                    <tr key={e.id} className="last:[&>td]:border-0">
                      <td className={td}><b>{e.studentName}</b></td>
                      <td className={td}>{e.sectionName}<div className="text-xs text-muted-foreground">{e.courseName}</div></td>
                      <td className={td}><span className="tnum">{e.agreedPrice}</span></td>
                      <td className={td}>
                        <Pill tone={ST_TONE[e.status]}>{ST_AR[e.status]}</Pill>
                        {e.status === 'Pending' && e.holdExpiresAt && (
                          <div className="tnum mt-1 text-[11px] text-muted-foreground">{L.hold}: {d16(e.holdExpiresAt)}</div>
                        )}
                      </td>
                      <td className={td}><span className="tnum">{d10(e.enrolledAt)}</span></td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          {e.status === 'Pending' && (
                            <Button size="sm" disabled={busy} onClick={() => run(() => enrollmentsApi.confirm(e.id), L.okConfirm)}>{L.confirm}</Button>
                          )}
                          {e.status === 'Confirmed' && (
                            <Button size="sm" variant="outline" onClick={() => { setTransferFor(e); setTargetId('') }}>{L.transfer}</Button>
                          )}
                          {(e.status === 'Pending' || e.status === 'Confirmed') && (
                            <Button size="sm" variant="outline" className="text-destructive"
                              onClick={() => setConfirmSt({ title: L.cancelEnroll, body: L.cancelEnrollBody, ok: L.okCancel, run: () => enrollmentsApi.cancel(e.id) })}>
                              {L.cancelEnroll}
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
          <Pager page={ePage} total={eTotal} set={setEPage} />
        </TabsContent>

        <TabsContent value="wait">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select className={field} value={wStatus} onChange={(e) => { setWStatus(e.target.value as WaitingStatus | ''); setWPage(1) }}>
              <option value="">{L.allStatus}</option>
              {(Object.keys(WT_AR) as WaitingStatus[]).map((k) => <option key={k} value={k}>{WT_AR[k]}</option>)}
            </select>
            <select className={field} value={wSection} onChange={(e) => { setWSection(e.target.value); setWPage(1) }}>
              <option value="">{L.allSections}</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {wLoading ? <Spinner /> : wItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
          ) : (
            <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{L.position}</th><th className={th}>{L.student}</th><th className={th}>{L.phone}</th>
                    <th className={th}>{L.section}</th><th className={th}>{L.status}</th><th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {wItems.map((w) => (
                    <tr key={w.id}>
                      <td className={td}><span className="tnum font-extrabold">{w.status === 'Waiting' ? w.position : '-'}</span></td>
                      <td className={td}><b>{w.studentName}</b></td>
                      <td className={td}><span className="tnum" dir="ltr">{w.studentPhone}</span></td>
                      <td className={td}>{w.sectionName}</td>
                      <td className={td}><Pill tone={WT_TONE[w.status]}>{WT_AR[w.status]}</Pill></td>
                      <td className={td}>
                        {w.status === 'Waiting' && (
                          <div className="flex flex-wrap gap-1">
                            <Button size="sm" onClick={() => { setPromoteFor(w); setPromoteHold(false) }}>{L.promote}</Button>
                            <Button size="sm" variant="outline" className="text-destructive"
                              onClick={() => setConfirmSt({ title: L.removeWait, body: L.cancelWaitBody, ok: L.okRemove, run: () => waitingApi.cancel(w.id) })}>
                              {L.removeWait}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={wPage} total={wTotal} set={setWPage} />
        </TabsContent>
      </Tabs>

      {/* enroll dialog */}
      <Dialog open={enrollOpen} onOpenChange={(o) => { if (!o) resetEnroll() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.enrollTitle}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <input className={field} placeholder={L.search} value={stFilter} onChange={(e) => setStFilter(e.target.value)} />
            <select className={field} value={stId} onChange={(e) => setStId(e.target.value)}>
              <option value="">{L.pickStudent}</option>
              {stOptions.map((s) => <option key={s.id} value={s.id}>{s.fullName} - {s.phoneNumber}</option>)}
            </select>
            <select className={field} value={secId} onChange={(e) => setSecId(e.target.value)}>
              <option value="">{L.pickSection}</option>
              {openSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <label className="flex min-h-[40px] items-center gap-2 text-sm">
              <input type="checkbox" checked={asHold} onChange={(e) => setAsHold(e.target.checked)} />{L.asHold}
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={!stId || !secId || busy} onClick={doAddWait}>{L.addWait}</Button>
            <Button disabled={!stId || !secId || busy} onClick={doEnroll}>
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.enrollNow}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* transfer dialog */}
      <Dialog open={!!transferFor} onOpenChange={(o) => { if (!o) setTransferFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.transferTitle}</DialogTitle></DialogHeader>
          {transferFor && <div className="text-sm"><b>{transferFor.studentName}</b> - {transferFor.sectionName}</div>}
          <select className={field} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">{L.targetSection}</option>
            {transferOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTransferFor(null)}>{L.back}</Button>
            <Button disabled={!targetId || busy}
              onClick={() => transferFor && run(() => enrollmentsApi.transfer(transferFor.id, Number(targetId)), L.okTransfer, () => setTransferFor(null))}>
              {L.transfer}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* promote dialog */}
      <Dialog open={!!promoteFor} onOpenChange={(o) => { if (!o) setPromoteFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.promoteTitle}</DialogTitle></DialogHeader>
          {promoteFor && <div className="text-sm"><b>{promoteFor.studentName}</b> - {promoteFor.sectionName}</div>}
          <label className="flex min-h-[40px] items-center gap-2 text-sm">
            <input type="checkbox" checked={promoteHold} onChange={(e) => setPromoteHold(e.target.checked)} />{L.promoteAsHold}
          </label>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPromoteFor(null)}>{L.back}</Button>
            <Button disabled={busy}
              onClick={() => promoteFor && run(() => waitingApi.promote(promoteFor.id, promoteHold), L.okPromote, () => setPromoteFor(null))}>
              {L.promote}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* generic confirm */}
      <Dialog open={!!confirmSt} onOpenChange={(o) => { if (!o) setConfirmSt(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{confirmSt?.title}</DialogTitle></DialogHeader>
          <div className="text-sm">{confirmSt?.body} {L.sure}</div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmSt(null)}>{L.back}</Button>
            <Button variant="destructive" disabled={busy}
              onClick={() => confirmSt && run(confirmSt.run, confirmSt.ok, () => setConfirmSt(null))}>
              {L.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}