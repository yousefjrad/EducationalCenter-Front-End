import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Layers, Plus, Pencil, Users, MapPin, Clock, XCircle, Trash2, DoorOpen } from 'lucide-react'
import { toast } from 'sonner'
import { useCan } from '@/lib/can'
import { useI18n } from '@/lib/i18n'
import { ApiError } from '@/services/api'
import { sectionsApi, type SectionDto, type SectionStatus } from '@/services/sections'
import { coursesApi, type CourseDto } from '@/services/courses'
import { trainersApi, type TrainerDto } from '@/services/trainers'
import { roomsApi, type RoomDto } from '@/services/rooms'
import RoomsDialog from '@/components/RoomsDialog'
import { PageHeader, SearchInput, EmptyState, Pill, Field, Money } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const PAGE_SIZE = 12
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const STATUSES: SectionStatus[] = ['Draft', 'OpenForEnrollment', 'InProgress', 'Completed', 'Cancelled']
const NEXT: Record<SectionStatus, SectionStatus[]> = {
  Draft: ['OpenForEnrollment', 'Cancelled'],
  OpenForEnrollment: ['InProgress', 'Cancelled'],
  InProgress: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
}
const statusTone: Record<SectionStatus, 'green' | 'gray' | 'red' | 'blue' | 'purple'> = {
  Draft: 'gray', OpenForEnrollment: 'green', InProgress: 'blue', Completed: 'purple', Cancelled: 'red',
}

const errText = (e: unknown) => (e instanceof ApiError ? e.message : String(e))
const toApiTime = (s: string) => (s.length === 5 ? s + ':00' : s)
const hhmm = (s: string) => s.slice(0, 5)

interface Opt { id: number; name: string; capacity?: number }
interface SlotForm { day: number; start: string; end: string }
interface FormState {
  name: string; courseId: string; trainerId: string; roomId: string
  price: string; capacity: string; minStudents: string; startDate: string; endDate: string; slots: SlotForm[]
}
const emptyForm: FormState = {
  name: '', courseId: '', trainerId: '', roomId: '', price: '', capacity: '20', minStudents: '0',
  startDate: '', endDate: '', slots: [{ day: 6, start: '16:00', end: '17:30' }],
}

const withCurrent = (list: Opt[], cur?: Opt) => (cur && !list.some((x) => x.id === cur.id) ? [...list, cur] : list)

export default function Sections() {
  const { t, lang } = useI18n()
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const canManage = useCan('Sections.Manage')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<SectionDto[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [courses, setCourses] = useState<CourseDto[]>([])
  const [trainers, setTrainers] = useState<TrainerDto[]>([])
  const [rooms, setRooms] = useState<RoomDto[]>([])

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<SectionDto | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [detail, setDetail] = useState<SectionDto | null>(null)
  const [roomsOpen, setRoomsOpen] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<{ section: SectionDto; status: SectionStatus } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SectionDto | null>(null)

  const statusLabel = (s: SectionStatus) => {
    switch (s) {
      case 'Draft': return L('مسودة', 'Draft')
      case 'OpenForEnrollment': return L('التسجيل مفتوح', 'Open for enrollment')
      case 'InProgress': return L('جارية', 'In progress')
      case 'Completed': return L('منتهية', 'Completed')
      default: return L('ملغاة', 'Cancelled')
    }
  }

  const loadLookups = useCallback(() => {
    Promise.all([
      coursesApi.list({ isActive: true, pageSize: 100 }),
      trainersApi.list({ isActive: true, pageSize: 100 }),
      roomsApi.list({ isActive: true, pageSize: 100 }),
    ])
      .then(([c, tr, r]) => { setCourses(c.items); setTrainers(tr.items); setRooms(r.items) })
      .catch((e) => toast.error(errText(e)))
  }, [])

  useEffect(() => { loadLookups() }, [loadLookups])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      sectionsApi.list({
        search: q.trim() || undefined,
        status: statusFilter === 'all' ? undefined : (statusFilter as SectionStatus),
        page, pageSize: PAGE_SIZE,
      })
        .then((r) => { if (alive) { setItems(r.items); setTotalPages(Math.max(1, r.totalPages)) } })
        .catch((e) => { if (alive) setError(errText(e)) })
        .finally(() => { if (alive) setLoading(false) })
    }, q ? 300 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, statusFilter, page, reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true) }

  useEffect(() => {
    if (params.get('new') === '1' && canManage) {
      openNew()
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, canManage])

  const openEdit = (s: SectionDto) => {
    setEditing(s)
    setForm({
      name: s.name, courseId: String(s.courseId), trainerId: String(s.trainerId), roomId: String(s.roomId),
      price: String(s.price), capacity: String(s.capacity), minStudents: String(s.minStudents),
      startDate: s.startDate, endDate: s.endDate,
      slots: s.schedules.map((x) => ({ day: Math.max(0, DAYS.indexOf(x.dayOfWeek)), start: hhmm(x.startTime), end: hhmm(x.endTime) })),
    })
    setOpen(true)
  }

  const onCourseChange = (v: string) => {
    const course = courses.find((c) => c.id === Number(v))
    setForm((f) => ({ ...f, courseId: v, price: !editing && f.price === '' && course ? String(course.defaultPrice) : f.price }))
  }

  const save = async () => {
    if (!form.name.trim() || (!editing && !form.courseId) || !form.trainerId || !form.roomId || !form.startDate || !form.endDate) {
      toast.error(t('common.required')); return
    }
    if (form.endDate < form.startDate) { toast.error(L('تاريخ النهاية قبل البداية', 'End date is before start date')); return }
    const capacity = Number(form.capacity)
    const minStudents = Number(form.minStudents || 0)
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) { toast.error(L('السعة بين 1 و 1000', 'Capacity must be 1-1000')); return }
    if (!Number.isInteger(minStudents) || minStudents < 0 || minStudents > capacity) { toast.error(L('الحد الأدنى للطلاب غير صحيح', 'Invalid minimum students')); return }
    const room = rooms.find((r) => r.id === Number(form.roomId)) ?? (editing && editing.roomId === Number(form.roomId) ? undefined : undefined)
    if (room && capacity > room.capacity) { toast.error(L('السعة أكبر من سعة القاعة (' + room.capacity + ')', 'Capacity exceeds the room capacity (' + room.capacity + ')')); return }
    if (form.slots.length === 0 || form.slots.some((s) => !s.start || !s.end || s.end <= s.start)) {
      toast.error(L('وقت النهاية يجب أن يكون بعد البداية', 'End time must be after start time')); return
    }
    const schedules = form.slots.map((s) => ({ dayOfWeek: DAYS[s.day], startTime: toApiTime(s.start), endTime: toApiTime(s.end) }))
    const base = {
      trainerId: Number(form.trainerId), roomId: Number(form.roomId), name: form.name.trim(),
      startDate: form.startDate, endDate: form.endDate, capacity, minStudents, schedules,
    }
    setSaving(true)
    try {
      if (editing) await sectionsApi.update(editing.id, { ...base, price: Number(form.price) || 0 })
      else await sectionsApi.create({ ...base, courseId: Number(form.courseId), price: form.price.trim() === '' ? null : Number(form.price) })
      toast.success(t('common.saved'))
      setOpen(false)
      reload()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setSaving(false)
    }
  }

  const applyStatus = async (section: SectionDto, status: SectionStatus) => {
    try {
      await sectionsApi.changeStatus(section.id, status)
      toast.success(t('common.saved'))
      setDetail(null)
      reload()
    } catch (e) {
      toast.error(errText(e))
    }
  }

  const requestStatus = (section: SectionDto, status: SectionStatus) => {
    if (status === 'Completed' || status === 'Cancelled') setConfirmStatus({ section, status })
    else void applyStatus(section, status)
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    try {
      await sectionsApi.remove(confirmDelete.id)
      toast.success(t('common.saved'))
      setConfirmDelete(null)
      reload()
    } catch (e) {
      toast.error(errText(e))
      setConfirmDelete(null)
    }
  }

  const dayName = (d: number) => t('days.' + d)
  const courseOpts: Opt[] = withCurrent(courses.map((c) => ({ id: c.id, name: c.name })), editing ? { id: editing.courseId, name: editing.courseName } : undefined)
  const trainerOpts: Opt[] = withCurrent(trainers.map((x) => ({ id: x.id, name: x.fullName })), editing ? { id: editing.trainerId, name: editing.trainerName } : undefined)
  const roomOpts: Opt[] = withCurrent(rooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity })), editing ? { id: editing.roomId, name: editing.roomName } : undefined)

  return (
    <div>
      <PageHeader
        title={t('sections.title')} subtitle={t('sections.subtitle')}
        actions={canManage && (
          <>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setRoomsOpen(true)}>
              <DoorOpen className="me-2 h-4 w-4" />{L('إدارة القاعات', 'Manage rooms')}
            </Button>
            <Button className="min-h-[44px]" onClick={openNew}><Plus className="me-2 h-4 w-4" />{t('sections.add')}</Button>
          </>
        )}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={q} onChange={(v: string) => { setQ(v); setPage(1) }} className="w-full max-w-sm" />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="min-h-[44px] w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>{L('إعادة المحاولة', 'Retry')}</Button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState message={q ? t('common.noResults') : t('sections.empty')} icon={<Layers className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((sec) => (
              <div key={sec.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <button className="min-w-0 text-start" onClick={() => setDetail(sec)}>
                    <div className="font-extrabold leading-snug hover:text-primary">{sec.name}</div>
                    <div className="text-xs text-muted-foreground">{sec.courseName}</div>
                  </button>
                  <Pill tone={statusTone[sec.status]}>{statusLabel(sec.status)}</Pill>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 shrink-0" />{sec.trainerName}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{sec.roomName}</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="tnum truncate">
                      {sec.schedules.map((s) => t('daysShort.' + DAYS.indexOf(s.dayOfWeek)) + ' ' + hhmm(s.startTime)).join(' - ')}
                    </span>
                  </div>
                </div>

                <div className="tnum mt-3 text-xs text-muted-foreground">
                  {L('السعة', 'Capacity')}: {sec.capacity} - {L('الحد الأدنى', 'Min')}: {sec.minStudents}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <Money amount={sec.price} className="text-primary" />
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="min-h-[36px]" onClick={() => setDetail(sec)}>{t('common.details')}</Button>
                    {canManage && (sec.status === 'Draft' || sec.status === 'OpenForEnrollment' || sec.status === 'InProgress') && (
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(sec)}><Pencil className="h-4 w-4" /></Button>
                    )}
                    {canManage && sec.status === 'Draft' && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setConfirmDelete(sec)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{L('السابق', 'Previous')}</Button>
              <span className="tnum text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{L('التالي', 'Next')}</Button>
            </div>
          )}
        </>
      )}

      {/* create / edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="scrollbar-thin max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t('sections.edit') : t('sections.add')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('sections.title_')} required>
              <Input className="min-h-[44px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('common.course')} required>
              <Select value={form.courseId} onValueChange={onCourseChange} disabled={!!editing}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="-" /></SelectTrigger>
                <SelectContent>
                  {courseOpts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('common.trainer')} required>
              <Select value={form.trainerId} onValueChange={(v) => setForm({ ...form, trainerId: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="-" /></SelectTrigger>
                <SelectContent>
                  {trainerOpts.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('common.room')} required>
              <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="-" /></SelectTrigger>
                <SelectContent>
                  {roomOpts.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}{r.capacity ? ' (' + r.capacity + ')' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('sections.price')}>
              <Input type="number" min={0} dir="ltr" className="min-h-[44px]" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label={t('sections.capacity')} required>
              <Input type="number" min={1} dir="ltr" className="min-h-[44px]" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </Field>
            <Field label={L('الحد الأدنى للطلاب', 'Minimum students')}>
              <Input type="number" min={0} dir="ltr" className="min-h-[44px]" value={form.minStudents} onChange={(e) => setForm({ ...form, minStudents: e.target.value })} />
            </Field>
            <div className="hidden sm:block" />
            <Field label={t('sections.startDate')} required>
              <Input type="date" dir="ltr" className="min-h-[44px]" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label={t('sections.endDate')} required>
              <Input type="date" dir="ltr" className="min-h-[44px]" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>

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
                  <span className="text-muted-foreground">-</span>
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

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="min-h-[44px]" onClick={save} disabled={saving}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* details */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <DialogContent className="scrollbar-thin max-h-[90vh] max-w-xl overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {detail.name}
                  <Pill tone={statusTone[detail.status]}>{statusLabel(detail.status)}</Pill>
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('common.course')}</div><div className="font-bold">{detail.courseName}</div></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('common.trainer')}</div><div className="font-bold">{detail.trainerName}</div></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('common.room')}</div><div className="font-bold">{detail.roomName}</div></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('sections.price')}</div><Money amount={detail.price} className="font-bold" /></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('sections.startDate')}</div><div className="tnum font-bold" dir="ltr">{detail.startDate}</div></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('sections.endDate')}</div><div className="tnum font-bold" dir="ltr">{detail.endDate}</div></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{t('sections.capacity')}</div><div className="tnum font-bold">{detail.capacity}</div></div>
                <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{L('الحد الأدنى', 'Minimum')}</div><div className="tnum font-bold">{detail.minStudents}</div></div>
              </div>
              <div>
                <div className="mb-2 text-sm font-bold">{t('sections.schedule')}</div>
                <div className="space-y-1">
                  {detail.schedules.map((s, i) => (
                    <div key={i} className="tnum flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <span className="font-bold">{t('days.' + DAYS.indexOf(s.dayOfWeek))}</span>
                      <span dir="ltr">{hhmm(s.startTime)} - {hhmm(s.endTime)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {L('الجلسات والطلاب والمدفوعات تظهر هنا بعد ربط صفحاتها.', 'Sessions, students and payments appear here once their pages are connected.')}
              </p>
              {canManage && NEXT[detail.status].length > 0 && (
                <DialogFooter className="gap-2">
                  {NEXT[detail.status].map((st) => (
                    <Button
                      key={st} className="min-h-[44px]"
                      variant={st === 'Cancelled' ? 'destructive' : st === 'Completed' ? 'outline' : 'default'}
                      onClick={() => requestStatus(detail, st)}
                    >
                      {st === 'OpenForEnrollment' ? L('فتح التسجيل', 'Open enrollment')
                        : st === 'InProgress' ? L('بدء الشعبة', 'Start section')
                        : st === 'Completed' ? t('sections.markComplete')
                        : t('sections.cancelSection')}
                    </Button>
                  ))}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* confirm complete / cancel */}
      <AlertDialog open={!!confirmStatus} onOpenChange={(o) => { if (!o) setConfirmStatus(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmStatus?.status === 'Completed' ? t('sections.markComplete') : t('sections.cancelSection')}</AlertDialogTitle>
            <AlertDialogDescription>{confirmStatus?.section.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-[44px]">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px]"
              onClick={() => { if (confirmStatus) { void applyStatus(confirmStatus.section, confirmStatus.status); setConfirmStatus(null) } }}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* confirm delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L('حذف الشعبة', 'Delete section')}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDelete?.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-[44px]">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90" onClick={doDelete}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoomsDialog open={roomsOpen} onClose={() => setRoomsOpen(false)} onChanged={loadLookups} />
    </div>
  )
}