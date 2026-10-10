import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Layers, Plus, Pencil, Users, CalendarX, CalendarClock, MapPin, Clock,
  CheckCircle2, XCircle, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useStore, useCan, activeEnrollmentsOf, enrollmentPaid, enrollmentRemaining,
  isSectionFull, sectionConflicts,
} from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import type { Section, WeeklySlot } from '@/types'
import { fmtDate, fmtSYP, timeRange } from '@/lib/format'
import { PageHeader, SearchInput, EmptyState, Pill, Field, TableScroll, Th, Td, Meter, Money } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const statusTone: Record<Section['status'], 'green' | 'gray' | 'red'> = { open: 'green', completed: 'gray', cancelled: 'red' }

interface SlotForm { day: number; start: string; end: string }
interface FormState {
  title: string; courseId: string; trainerId: string; roomId: string
  price: string; capacity: string; startDate: string; endDate: string; slots: SlotForm[]
}
const emptyForm: FormState = {
  title: '', courseId: '', trainerId: '', roomId: '', price: '', capacity: '',
  startDate: '', endDate: '', slots: [{ day: 6, start: '16:00', end: '17:30' }],
}

export default function Sections() {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const canManage = useCan('Sections.Manage')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Section | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [detail, setDetail] = useState<Section | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'complete' | 'cancel'; section: Section } | null>(null)

  useEffect(() => {
    if (params.get('new') === '1' && canManage) {
      openNew()
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, canManage])

  const list = useMemo(
    () =>
      state.sections.filter((s) => {
        if (statusFilter !== 'all' && s.status !== statusFilter) return false
        const course = state.courses.find((c) => c.id === s.courseId)
        return (s.title + (course?.name ?? '')).includes(q.trim())
      }),
    [state.sections, state.courses, q, statusFilter],
  )

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (s: Section) => {
    setEditing(s)
    setForm({
      title: s.title, courseId: String(s.courseId), trainerId: String(s.trainerId), roomId: String(s.roomId),
      price: String(s.price), capacity: String(s.capacity), startDate: s.startDate, endDate: s.endDate,
      slots: s.schedule.map((x) => ({ ...x })),
    })
    setOpen(true)
  }

  // live conflict detection while filling the form
  const conflicts = useMemo(() => {
    if (!form.roomId || !form.trainerId || form.slots.length === 0) return null
    const cand = {
      id: editing?.id,
      courseId: Number(form.courseId), trainerId: Number(form.trainerId), roomId: Number(form.roomId),
      title: form.title, price: Number(form.price), capacity: Number(form.capacity) || 0,
      schedule: form.slots as WeeklySlot[], startDate: form.startDate, endDate: form.endDate, status: 'open' as const,
    }
    return sectionConflicts(state, cand)
  }, [form, editing, state])

  const save = () => {
    if (!form.title.trim() || !form.courseId || !form.trainerId || !form.roomId || !form.startDate || !form.endDate) {
      toast.error(t('common.required'))
      return
    }
    if (conflicts?.roomConflict || conflicts?.trainerConflict || conflicts?.capacityIssue) {
      toast.error(t('sections.conflictRoom'))
      return
    }
    const section: Section = {
      id: editing?.id ?? 0,
      courseId: Number(form.courseId), trainerId: Number(form.trainerId), roomId: Number(form.roomId),
      title: form.title.trim(), price: Number(form.price) || 0, capacity: Number(form.capacity) || 0,
      schedule: form.slots, startDate: form.startDate, endDate: form.endDate,
      status: editing?.status ?? 'open',
    }
    dispatch({ type: 'SAVE_SECTION', section })
    toast.success(t('common.saved'))
    setOpen(false)
  }

  const dayName = (d: number) => t(`days.${d}`)

  return (
    <div>
      <PageHeader
        title={t('sections.title')} subtitle={t('sections.subtitle')}
        actions={canManage && <Button className="min-h-[44px]" onClick={openNew}><Plus className="me-2 h-4 w-4" />{t('sections.add')}</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={q} onChange={setQ} className="w-full max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-h-[44px] w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="open">{t('sections.status.open')}</SelectItem>
            <SelectItem value="completed">{t('sections.status.completed')}</SelectItem>
            <SelectItem value="cancelled">{t('sections.status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <EmptyState message={q ? t('common.noResults') : t('sections.empty')} icon={<Layers className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((sec) => {
            const course = state.courses.find((c) => c.id === sec.courseId)
            const trainer = state.trainers.find((x) => x.id === sec.trainerId)
            const room = state.rooms.find((r) => r.id === sec.roomId)
            const enrolled = activeEnrollmentsOf(state, sec.id).length
            const full = isSectionFull(state, sec.id)
            return (
              <div key={sec.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <button className="min-w-0 text-start" onClick={() => setDetail(sec)}>
                    <div className="font-extrabold leading-snug hover:text-primary">{sec.title}</div>
                    <div className="text-xs text-muted-foreground">{course?.name}</div>
                  </button>
                  <Pill tone={statusTone[sec.status]}>{t(`sections.status.${sec.status}`)}</Pill>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 shrink-0" />{trainer?.name}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{room?.name}</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="tnum truncate">
                      {sec.schedule.map((s) => `${t(`daysShort.${s.day}`)} ${s.start}`).join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('sections.enrolled')}</span>
                    <span className="tnum font-bold">{enrolled}/{sec.capacity}{full && <span className="ms-1 text-destructive">({t('sections.full')})</span>}</span>
                  </div>
                  <Meter value={enrolled} max={sec.capacity} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <Money amount={sec.price} className="text-primary" />
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="min-h-[36px]" onClick={() => setDetail(sec)}>{t('common.details')}</Button>
                    {canManage && sec.status === 'open' && (
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(sec)}><Pencil className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ---------- create / edit dialog ---------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="scrollbar-thin max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t('sections.edit') : t('sections.add')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('sections.title_')} required>
              <Input className="min-h-[44px] sm:col-span-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label={t('common.course')} required>
              <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {state.courses.filter((c) => c.active).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('common.trainer')} required>
              <Select value={form.trainerId} onValueChange={(v) => setForm({ ...form, trainerId: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {state.trainers.filter((x) => x.active).map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('common.room')} required>
              <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {state.rooms.filter((r) => r.active).map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name} ({r.capacity})</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('sections.price')} required>
              <Input type="number" dir="ltr" className="min-h-[44px]" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label={t('sections.capacity')} required>
              <Input type="number" dir="ltr" className="min-h-[44px]" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </Field>
            <Field label={t('sections.startDate')} required>
              <Input type="date" dir="ltr" className="min-h-[44px]" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label={t('sections.endDate')} required>
              <Input type="date" dir="ltr" className="min-h-[44px]" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>

          {/* weekly slots */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold">{t('sections.schedule')}</span>
              <Button variant="outline" size="sm" className="min-h-[36px]" onClick={() => setForm({ ...form, slots: [...form.slots, { day: 0, start: '16:00', end: '17:30' }] })}>
                <Plus className="me-1 h-3.5 w-3.5" />{t('sections.addSlot')}
              </Button>
            </div>
            <div className="space-y-2">
              {form.slots.map((slot, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
                  <Select value={String(slot.day)} onValueChange={(v) => setForm({ ...form, slots: form.slots.map((s, j) => (j === i ? { ...s, day: Number(v) } : s)) })}>
                    <SelectTrigger className="min-h-[44px] w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => <SelectItem key={d} value={String(d)}>{dayName(d)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="time" dir="ltr" className="min-h-[44px] w-[110px]" value={slot.start} onChange={(e) => setForm({ ...form, slots: form.slots.map((s, j) => (j === i ? { ...s, start: e.target.value } : s)) })} />
                  <span className="text-muted-foreground">—</span>
                  <Input type="time" dir="ltr" className="min-h-[44px] w-[110px]" value={slot.end} onChange={(e) => setForm({ ...form, slots: form.slots.map((s, j) => (j === i ? { ...s, end: e.target.value } : s)) })} />
                  {form.slots.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive" onClick={() => setForm({ ...form, slots: form.slots.filter((_, j) => j !== i) })}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* conflict warnings */}
          {conflicts && (conflicts.roomConflict || conflicts.trainerConflict || conflicts.capacityIssue) && (
            <div className="mt-4 space-y-2 rounded-lg bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {conflicts.roomConflict && <div>⚠ {t('sections.conflictRoom')}: {conflicts.roomConflict.title}</div>}
              {conflicts.trainerConflict && <div>⚠ {t('sections.conflictTrainer')}: {conflicts.trainerConflict.title}</div>}
              {conflicts.capacityIssue && <div>⚠ {t('sections.conflictCapacity')}</div>}
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="min-h-[44px]" onClick={save}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- detail dialog ---------- */}
      {detail && (
        <SectionDetail
          section={state.sections.find((s) => s.id === detail.id)!}
          onClose={() => setDetail(null)}
          onComplete={() => setConfirmAction({ type: 'complete', section: detail })}
          onCancel={() => setConfirmAction({ type: 'cancel', section: detail })}
        />
      )}

      {/* ---------- complete / cancel confirm ---------- */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'complete' ? t('sections.markComplete') : t('sections.cancelSection')}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.section.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-[44px]">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px]"
              onClick={() => {
                if (!confirmAction) return
                dispatch({ type: 'SET_SECTION_STATUS', id: confirmAction.section.id, status: confirmAction.type === 'complete' ? 'completed' : 'cancelled' })
                toast.success(t(confirmAction.type === 'complete' ? 'sections.completedMsg' : 'sections.cancelledMsg'))
                setDetail(null)
                setConfirmAction(null)
              }}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------

function SectionDetail({
  section, onClose, onComplete, onCancel,
}: { section: Section; onClose: () => void; onComplete: () => void; onCancel: () => void }) {
  const { t, lang } = useI18n()
  const { state, dispatch } = useStore()
  const canManage = useCan('Sections.Manage')
  const sessions = state.sessions.filter((s) => s.sectionId === section.id).sort((a, b) => a.date.localeCompare(b.date))
  const enrolls = activeEnrollmentsOf(state, section.id)
  const collected = enrolls.reduce((a, e) => a + enrollmentPaid(state, e.id), 0)
  const remaining = enrolls.reduce((a, e) => a + enrollmentRemaining(state, e.id), 0)
  const [sessAction, setSessAction] = useState<{ id: number; type: 'cancel' | 'postpone' } | null>(null)
  const [note, setNote] = useState('')
  const [newDate, setNewDate] = useState('')

  const sessionPill = (st: string) =>
    st === 'held' ? <Pill tone="green">{t('session.status.held')}</Pill>
    : st === 'cancelled' ? <Pill tone="red">{t('session.status.cancelled')}</Pill>
    : st === 'postponed' ? <Pill tone="amber">{t('session.status.postponed')}</Pill>
    : <Pill tone="blue">{t('session.status.scheduled')}</Pill>

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="scrollbar-thin max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {section.title}
            <Pill tone={section.status === 'open' ? 'green' : section.status === 'completed' ? 'gray' : 'red'}>
              {t(`sections.status.${section.status}`)}
            </Pill>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('sections.enrolled')}</div><div className="tnum font-extrabold">{enrolls.length}/{section.capacity}</div></div>
          <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('sections.vacant')}</div><div className="tnum font-extrabold">{Math.max(0, section.capacity - enrolls.length)}</div></div>
          <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('sections.collected')}</div><div className="tnum font-extrabold text-[hsl(var(--success))]">{fmtSYP(collected, lang)}</div></div>
          <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('common.remaining')}</div><div className="tnum font-extrabold text-destructive">{fmtSYP(remaining, lang)}</div></div>
        </div>

        <Tabs defaultValue="sessions" className="mt-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="sessions" className="min-h-[44px]">{t('sections.tab.sessions')}</TabsTrigger>
            <TabsTrigger value="students" className="min-h-[44px]">{t('sections.tab.students')}</TabsTrigger>
            <TabsTrigger value="finance" className="min-h-[44px]">{t('sections.tab.finance')}</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <TableScroll>
              <table className="w-full min-w-[560px]">
                <thead><tr><Th>{t('common.date')}</Th><Th>{t('common.time')}</Th><Th>{t('common.status')}</Th><Th>{t('common.notes')}</Th>{canManage && <Th></Th>}</tr></thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <Td className="tnum whitespace-nowrap">{fmtDate(s.date)}</Td>
                      <Td className="tnum whitespace-nowrap">{timeRange(s.start, s.end)}</Td>
                      <Td>{sessionPill(s.status)}</Td>
                      <Td className="max-w-[200px]"><span className="line-clamp-2 text-xs text-muted-foreground">{s.note ?? '—'}</span></Td>
                      {canManage && (
                        <Td>
                          {s.status === 'scheduled' && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-[hsl(var(--warning))]" title={t('session.postpone')} onClick={() => { setSessAction({ id: s.id, type: 'postpone' }); setNewDate(s.date); setNote('') }}>
                                <CalendarClock className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" title={t('session.cancel')} onClick={() => { setSessAction({ id: s.id, type: 'cancel' }); setNote('') }}>
                                <CalendarX className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </TabsContent>

          <TabsContent value="students">
            {enrolls.length === 0 ? (
              <EmptyState message={t('att.empty')} icon={<Users className="h-9 w-9" strokeWidth={1.2} />} />
            ) : (
              <TableScroll>
                <table className="w-full min-w-[520px]">
                  <thead><tr><Th>{t('common.student')}</Th><Th>{t('common.paid')}</Th><Th>{t('common.remaining')}</Th></tr></thead>
                  <tbody>
                    {enrolls.map((e) => {
                      const st = state.students.find((x) => x.id === e.studentId)
                      return (
                        <tr key={e.id} className="border-b last:border-0">
                          <Td className="font-bold">{st?.name}</Td>
                          <Td><Money amount={enrollmentPaid(state, e.id)} className="text-[hsl(var(--success))]" /></Td>
                          <Td><Money amount={enrollmentRemaining(state, e.id)} className={enrollmentRemaining(state, e.id) > 0 ? 'text-destructive' : 'text-muted-foreground'} /></Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </TableScroll>
            )}
          </TabsContent>

          <TabsContent value="finance">
            <div className="space-y-2">
              {enrolls.flatMap((e) =>
                state.payments.filter((p) => p.enrollmentId === e.id && !p.voided).map((p) => {
                  const st = state.students.find((x) => x.id === e.studentId)
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-bold">{st?.name}</div>
                        <div className="tnum text-xs text-muted-foreground">{p.receiptNo} · {fmtDate(p.date)}</div>
                      </div>
                      <div className="text-end">
                        <Money amount={p.amountSYP} />
                        {p.currency === 'USD' && <div className="tnum text-xs text-muted-foreground" dir="ltr">${p.amount} × {p.exchangeRate}</div>}
                      </div>
                    </div>
                  )
                }),
              )}
              {collected === 0 && <EmptyState message={t('payments.empty')} icon={<Wallet className="h-9 w-9" strokeWidth={1.2} />} />}
            </div>
          </TabsContent>
        </Tabs>

        {canManage && section.status === 'open' && (
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={onComplete}>
              <CheckCircle2 className="me-2 h-4 w-4" />{t('sections.markComplete')}
            </Button>
            <Button variant="destructive" className="min-h-[44px]" onClick={onCancel}>
              <XCircle className="me-2 h-4 w-4" />{t('sections.cancelSection')}
            </Button>
          </DialogFooter>
        )}

        {/* session action sub-dialog */}
        <Dialog open={!!sessAction} onOpenChange={() => setSessAction(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{sessAction?.type === 'cancel' ? t('session.cancel') : t('session.postpone')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {sessAction?.type === 'postpone' && (
                <Field label={t('session.postponeTo')}>
                  <Input type="date" dir="ltr" className="min-h-[44px]" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </Field>
              )}
              <Field label={t('common.notes')}>
                <Input className="min-h-[44px]" value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="min-h-[44px]" onClick={() => setSessAction(null)}>{t('common.cancel')}</Button>
              <Button
                className="min-h-[44px]"
                variant={sessAction?.type === 'cancel' ? 'destructive' : 'default'}
                onClick={() => {
                  if (!sessAction) return
                  dispatch({
                    type: 'SET_SESSION_STATUS', id: sessAction.id,
                    status: sessAction.type === 'cancel' ? 'cancelled' : 'postponed',
                    note: note || undefined, newDate: sessAction.type === 'postpone' ? newDate : undefined,
                  })
                  toast.success(t('session.updated'))
                  setSessAction(null)
                }}
              >
                {t('common.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
