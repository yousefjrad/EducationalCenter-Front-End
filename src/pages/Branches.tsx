import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Power, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ApiError, api } from '@/services/api'
import { hasPermission } from '@/lib/permissions'
import {
  branchesApi,
  type BranchCourseDto, type BranchDto, type BranchTrainerDto,
} from '@/services/branches'

const L = {
  title: '\u0627\u0644\u0641\u0631\u0648\u0639',
  subtitle: '\u0625\u062f\u0627\u0631\u0629 \u0641\u0631\u0648\u0639 \u0627\u0644\u0645\u0631\u0643\u0632: \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a\u060c \u0627\u0644\u062f\u0648\u0631\u0627\u062a \u0627\u0644\u0645\u062a\u0627\u062d\u0629\u060c \u0648\u0627\u0644\u0645\u062f\u0631\u0628\u0648\u0646',
  add: '\u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639',
  edit: '\u062a\u0639\u062f\u064a\u0644 \u0641\u0631\u0639',
  name: '\u0627\u0633\u0645 \u0627\u0644\u0641\u0631\u0639',
  code: '\u0631\u0645\u0632 \u0627\u0644\u0641\u0631\u0639 (\u062d\u0631\u0648\u0641 \u0625\u0646\u0643\u0644\u064a\u0632\u064a\u0629\u060c \u0645\u062b\u0644 DAM)',
  codeNote: '\u0627\u0644\u0631\u0645\u0632 \u064a\u0638\u0647\u0631 \u0641\u064a \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0625\u064a\u0635\u0627\u0644\u0627\u062a \u0648\u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a \u0648\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u063a\u064a\u064a\u0631\u0647 \u0644\u0627\u062d\u0642\u0627\u064b.',
  gov: '\u0627\u0644\u0645\u062d\u0627\u0641\u0638\u0629',
  address: '\u0627\u0644\u0639\u0646\u0648\u0627\u0646',
  phone: '\u0627\u0644\u0647\u0627\u062a\u0641',
  status: '\u0627\u0644\u062d\u0627\u0644\u0629',
  active: '\u0641\u0639\u0651\u0627\u0644',
  closed: '\u0645\u0648\u0642\u0648\u0641',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0631\u0648\u0639',
  save: '\u062d\u0641\u0638',
  back: '\u0631\u062c\u0648\u0639',
  saved: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638',
  confirm: '\u062a\u0623\u0643\u064a\u062f',
  close: '\u0625\u064a\u0642\u0627\u0641',
  reopen: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0641\u0639\u064a\u0644',
  closeTitle: '\u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0641\u0631\u0639',
  closeNote: '\u0627\u0644\u0625\u064a\u0642\u0627\u0641 \u0645\u0624\u0642\u062a: \u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u0633\u062c\u064a\u0644 \u0623\u064a \u0639\u0645\u0644\u064a\u0629 \u062c\u062f\u064a\u062f\u0629 \u0641\u064a \u0627\u0644\u0641\u0631\u0639\u060c \u0648\u062a\u0628\u0642\u0649 \u0643\u0644 \u0628\u064a\u0627\u0646\u0627\u062a\u0647 \u0645\u062d\u0641\u0648\u0638\u0629 \u0648\u064a\u0645\u0643\u0646 \u0625\u0639\u0627\u062f\u0629 \u062a\u0641\u0639\u064a\u0644\u0647.',
  manage: '\u0627\u0644\u062f\u0648\u0631\u0627\u062a \u0648\u0627\u0644\u0645\u062f\u0631\u0628\u0648\u0646',
  courses: '\u0627\u0644\u062f\u0648\u0631\u0627\u062a',
  trainers: '\u0627\u0644\u0645\u062f\u0631\u0628\u0648\u0646',
  coursesNote: '\u0641\u0639\u0651\u0644 \u0627\u0644\u062f\u0648\u0631\u0627\u062a \u0627\u0644\u062a\u064a \u064a\u0642\u062f\u0645\u0647\u0627 \u0647\u0630\u0627 \u0627\u0644\u0641\u0631\u0639 \u0645\u0646 \u0643\u062a\u0627\u0644\u0648\u062c \u0627\u0644\u062f\u0648\u0631\u0627\u062a \u0627\u0644\u0639\u0627\u0645.',
  trainersNote: '\u0627\u0631\u0628\u0637 \u0627\u0644\u0645\u062f\u0631\u0628\u064a\u0646 \u0627\u0644\u0630\u064a\u0646 \u064a\u062f\u0631\u0651\u0633\u0648\u0646 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0641\u0631\u0639 (\u064a\u0645\u0643\u0646 \u0644\u0644\u0645\u062f\u0631\u0628 \u0627\u0644\u062a\u062f\u0631\u064a\u0633 \u0641\u064a \u0623\u0643\u062b\u0631 \u0645\u0646 \u0641\u0631\u0639).',
  enable: '\u062a\u0641\u0639\u064a\u0644',
  disable: '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0641\u0639\u064a\u0644',
  link: '\u0631\u0628\u0637',
  unlink: '\u0641\u0643 \u0627\u0644\u0631\u0628\u0637',
  enabled: '\u0645\u0641\u0639\u0651\u0644\u0629',
  linked: '\u0645\u0631\u062a\u0628\u0637',
  noCourses: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062f\u0648\u0631\u0627\u062a \u0641\u064a \u0627\u0644\u0643\u062a\u0627\u0644\u0648\u062c',
  noTrainers: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u062f\u0631\u0628\u0648\u0646',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
}

const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const notify = () => window.dispatchEvent(new Event('branches:changed'))

interface CourseLite { id: number; name: string; code?: string | null }
interface TrainerLite { id: number; fullName: string }
interface PagedLite<T> { items: T[] }

export default function Branches() {
  const canManage = hasPermission('Branches.Manage')
  const [items, setItems] = useState<BranchDto[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState<BranchDto | 'new' | null>(null)
  const [fCode, setFCode] = useState('')
  const [fName, setFName] = useState('')
  const [fGov, setFGov] = useState('')
  const [fAddr, setFAddr] = useState('')
  const [fPhone, setFPhone] = useState('')

  const [closeFor, setCloseFor] = useState<BranchDto | null>(null)

  const [mBranch, setMBranch] = useState<BranchDto | null>(null)
  const [mTab, setMTab] = useState<'courses' | 'trainers'>('courses')
  const [mLoading, setMLoading] = useState(false)
  const [allCourses, setAllCourses] = useState<CourseLite[]>([])
  const [allTrainers, setAllTrainers] = useState<TrainerLite[]>([])
  const [bCourses, setBCourses] = useState<BranchCourseDto[]>([])
  const [bTrainers, setBTrainers] = useState<BranchTrainerDto[]>([])

  useEffect(() => {
    let alive = true
    setLoading(true)
    branchesApi.list()
      .then((r) => { if (alive) setItems(r) })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [reloadKey])

  const reload = () => { setReloadKey((k) => k + 1); notify() }

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

  const openForm = (b: BranchDto | 'new') => {
    setForm(b)
    if (b === 'new') { setFCode(''); setFName(''); setFGov(''); setFAddr(''); setFPhone('') }
    else { setFCode(b.code); setFName(b.name); setFGov(b.governorate ?? ''); setFAddr(b.address ?? ''); setFPhone(b.phone ?? '') }
  }

  const codeOk = /^[A-Za-z0-9]{2,10}$/.test(fCode.trim())
  const formValid = !!fName.trim() && (form !== 'new' || codeOk)

  const saveForm = () => {
    const body = {
      name: fName.trim(),
      governorate: fGov.trim() || null,
      address: fAddr.trim() || null,
      phone: fPhone.trim() || null,
    }
    return act(
      () => (form === 'new' || form === null
        ? branchesApi.create({ ...body, code: fCode.trim().toUpperCase() })
        : branchesApi.update(form.id, body)),
      L.saved,
      () => setForm(null),
    )
  }

  // ---- courses and trainers of one branch ----
  const loadLinks = useCallback((id: number) => {
    setMLoading(true)
    Promise.all([
      api.get<PagedLite<CourseLite>>('/courses', { pageSize: 100 }),
      api.get<PagedLite<TrainerLite>>('/trainers', { pageSize: 100 }),
      branchesApi.courses(id),
      branchesApi.trainers(id),
    ])
      .then(([c, t, bc, bt]) => {
        setAllCourses(c.items)
        setAllTrainers(t.items)
        setBCourses(bc)
        setBTrainers(bt)
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setMLoading(false))
  }, [])

  const openManage = (b: BranchDto) => {
    setMBranch(b)
    setMTab('courses')
    setAllCourses([]); setAllTrainers([]); setBCourses([]); setBTrainers([])
    loadLinks(b.id)
  }

  const linkAct = async (fn: () => Promise<unknown>) => {
    if (!mBranch) return
    setBusy(true)
    try {
      await fn()
      loadLinks(mBranch.id)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const courseOn = (id: number) => bCourses.some((x) => x.courseId === id && x.isActive)
  const trainerOn = (id: number) => bTrainers.some((x) => x.trainerId === id)

  return (
    <div>
      <PageHeader
        title={L.title}
        subtitle={L.subtitle}
        actions={canManage ? <Button className="min-h-[44px]" onClick={() => openForm('new')}><Plus className="me-2 h-4 w-4" />{L.add}</Button> : undefined}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{L.name}</th><th className={th}>{L.gov}</th><th className={th}>{L.phone}</th>
                <th className={th}>{L.status}</th><th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td className={td}>
                    <b>{b.name}</b>
                    <div className="tnum text-xs text-muted-foreground" dir="ltr">{b.code}</div>
                  </td>
                  <td className={td}>{b.governorate ?? ''}</td>
                  <td className={td}><span className="tnum" dir="ltr">{b.phone ?? ''}</span></td>
                  <td className={td}><Pill tone={b.isActive ? 'green' : 'gray'}>{b.isActive ? L.active : L.closed}</Pill></td>
                  <td className={td}>
                    {canManage && (
                      <div className="flex flex-wrap items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => openManage(b)}><Settings2 className="me-1 h-4 w-4" />{L.manage}</Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openForm(b)}><Pencil className="h-4 w-4" /></Button>
                        {b.isActive ? (
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" title={L.close} onClick={() => setCloseFor(b)}><Power className="h-4 w-4" /></Button>
                        ) : (
                          <Button size="sm" disabled={busy} onClick={() => act(() => branchesApi.reopen(b.id), L.saved)}>{L.reopen}</Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* create / edit */}
      <Dialog open={form !== null} onOpenChange={(o) => { if (!o) setForm(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form === 'new' ? L.add : L.edit}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <input className={field} placeholder={L.name} value={fName} onChange={(e) => setFName(e.target.value)} />
            <input
              className={field} dir="ltr" placeholder={L.code} value={fCode} maxLength={10}
              disabled={form !== 'new'} onChange={(e) => setFCode(e.target.value)}
            />
            {form === 'new' && <div className="text-xs text-muted-foreground">{L.codeNote}</div>}
            <input className={field} placeholder={L.gov} value={fGov} onChange={(e) => setFGov(e.target.value)} />
            <input className={field} placeholder={L.address} value={fAddr} onChange={(e) => setFAddr(e.target.value)} />
            <input className={field} dir="ltr" placeholder={L.phone} value={fPhone} onChange={(e) => setFPhone(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setForm(null)}>{L.back}</Button>
            <Button disabled={busy || !formValid} onClick={saveForm}>{busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* close confirmation */}
      <Dialog open={!!closeFor} onOpenChange={(o) => { if (!o) setCloseFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.closeTitle}</DialogTitle></DialogHeader>
          {closeFor && <div className="text-sm"><b>{closeFor.name}</b></div>}
          <div className="text-sm text-muted-foreground">{L.closeNote}</div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCloseFor(null)}>{L.back}</Button>
            <Button
              variant="destructive" disabled={busy}
              onClick={() => closeFor && act(() => branchesApi.close(closeFor.id), L.saved, () => setCloseFor(null))}
            >{L.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* courses and trainers of a branch */}
      <Dialog open={!!mBranch} onOpenChange={(o) => { if (!o) setMBranch(null) }}>
        <DialogContent className="scrollbar-thin max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{mBranch?.name}</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Button variant={mTab === 'courses' ? 'default' : 'outline'} className="min-h-[44px]" onClick={() => setMTab('courses')}>{L.courses}</Button>
            <Button variant={mTab === 'trainers' ? 'default' : 'outline'} className="min-h-[44px]" onClick={() => setMTab('trainers')}>{L.trainers}</Button>
          </div>
          <div className="text-xs text-muted-foreground">{mTab === 'courses' ? L.coursesNote : L.trainersNote}</div>

          {mLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

          {!mLoading && mTab === 'courses' && (
            <div className="space-y-2">
              {allCourses.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">{L.noCourses}</div>}
              {allCourses.map((c) => {
                const on = courseOn(c.id)
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                    <div className="min-w-0 font-bold">{c.name}</div>
                    <div className="flex items-center gap-2">
                      {on && <Pill tone="green">{L.enabled}</Pill>}
                      <Button
                        size="sm" variant={on ? 'outline' : 'default'} disabled={busy}
                        onClick={() => mBranch && linkAct(() => (on ? branchesApi.disableCourse(mBranch.id, c.id) : branchesApi.enableCourse(mBranch.id, c.id)))}
                      >{on ? L.disable : L.enable}</Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!mLoading && mTab === 'trainers' && (
            <div className="space-y-2">
              {allTrainers.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">{L.noTrainers}</div>}
              {allTrainers.map((t) => {
                const on = trainerOn(t.id)
                return (
                  <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                    <div className="min-w-0 font-bold">{t.fullName}</div>
                    <div className="flex items-center gap-2">
                      {on && <Pill tone="green">{L.linked}</Pill>}
                      <Button
                        size="sm" variant={on ? 'outline' : 'default'} disabled={busy}
                        onClick={() => mBranch && linkAct(() => (on ? branchesApi.removeTrainer(mBranch.id, t.id) : branchesApi.addTrainer(mBranch.id, t.id)))}
                      >{on ? L.unlink : L.link}</Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}