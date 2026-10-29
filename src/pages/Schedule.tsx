import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, MapPin, Users2 } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { api, ApiError } from '@/services/api'
import { sessionsApi, toApiTime, type ClassSessionDto, type SessionStatus } from '@/services/sessions'

const DAYS = [0, 1, 2, 3, 4, 5, 6]
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const startOfWeek = (d: Date) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -d.getDay())
const hm = (t: string) => t.slice(0, 5)
const MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول']
const weekLabel = (start: Date) => {
  const end = addDays(start, 6)
  const a = `${start.getDate()} ${MONTHS[start.getMonth()]}`
  const b = `${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
  return start.getFullYear() === end.getFullYear() ? `من ${a} إلى ${b}` : `من ${a} ${start.getFullYear()} إلى ${b}`
}
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع')

const STATUS_AR: Record<SessionStatus, string> = {
  Scheduled: 'مجدولة',
  Held: 'منعقدة',
  Postponed: 'مؤجلة',
  Cancelled: 'ملغاة',
}
const STATUS_TONE: Record<SessionStatus, 'teal' | 'green' | 'amber' | 'red'> = {
  Scheduled: 'teal',
  Held: 'green',
  Postponed: 'amber',
  Cancelled: 'red',
}
const CHIP: Record<SessionStatus, string> = {
  Scheduled: 'border-primary bg-primary/10',
  Held: 'border-emerald-500 bg-emerald-100/60',
  Postponed: 'border-amber-500 bg-amber-100/60',
  Cancelled: 'border-red-500 bg-red-100/60 opacity-70',
}

interface SectionLite { id: number; name: string; status: string }

const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'

export default function Schedule() {
  const { t } = useI18n()
  const [tab, setTab] = useState('rooms')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [sessions, setSessions] = useState<ClassSessionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  // generate panel
  const [sections, setSections] = useState<SectionLite[]>([])
  const [genId, setGenId] = useState('')
  const [genBusy, setGenBusy] = useState(false)

  // session dialog
  const [sel, setSel] = useState<ClassSessionDto | null>(null)
  const [mode, setMode] = useState<'view' | 'postpone' | 'cancel'>('view')
  const [nd, setNd] = useState('')
  const [ns, setNs] = useState('')
  const [ne, setNe] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    sessionsApi
      .list({ from: iso(weekStart), to: iso(addDays(weekStart, 6)), pageSize: 200 })
      .then((r) => { if (alive) setSessions(r.items) })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [weekStart, reloadKey])

  useEffect(() => {
    ;(api.get('/sections?pageSize=100') as Promise<{ items: SectionLite[] }>)
      .then((r) => setSections(r.items.filter((s) => s.status !== 'Completed' && s.status !== 'Cancelled')))
      .catch(() => { /* ignore: panel stays empty */ })
  }, [reloadKey])

  const rows = useMemo(() => {
    const byRoom = new Map<number, string>()
    const byTrainer = new Map<number, string>()
    sessions.forEach((s) => {
      byRoom.set(s.roomId, s.roomName)
      byTrainer.set(s.trainerId, s.trainerName)
    })
    const toArr = (m: Map<number, string>) => [...m.entries()].map(([id, name]) => ({ id, name }))
    return { rooms: toArr(byRoom), trainers: toArr(byTrainer) }
  }, [sessions])

  const dayLoad = DAYS.map((d) => ({
    day: d,
    count: sessions.filter((s) => s.status !== 'Cancelled' && parseISO(s.date).getDay() === d).length,
  }))
  const maxLoad = Math.max(1, ...dayLoad.map((x) => x.count))

  const openSession = (s: ClassSessionDto) => {
    setSel(s)
    setMode('view')
    setNd(s.date)
    setNs(hm(s.startTime))
    setNe(hm(s.endTime))
    setReason('')
  }

  const doPostpone = async () => {
    if (!sel) return
    setBusy(true)
    try {
      await sessionsApi.postpone(sel.id, {
        newDate: nd, newStartTime: toApiTime(ns), newEndTime: toApiTime(ne), reason: reason.trim() || undefined,
      })
      toast.success('تم تأجيل الجلسة')
      setSel(null)
      setReloadKey((k) => k + 1)
    } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }

  const doCancel = async () => {
    if (!sel) return
    setBusy(true)
    try {
      await sessionsApi.cancel(sel.id, { reason: reason.trim() || undefined })
      toast.success('تم إلغاء الجلسة')
      setSel(null)
      setReloadKey((k) => k + 1)
    } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }

  const doGenerate = async () => {
    if (!genId) return
    setGenBusy(true)
    try {
      const res = await sessionsApi.generate(Number(genId))
      toast.success(`تم توليد ${res.length} جلسة`)
      if (res.length > 0) setWeekStart(startOfWeek(parseISO(res[0].date)))
      setGenId('')
      setReloadKey((k) => k + 1)
    } catch (e) { toast.error(errMsg(e)) } finally { setGenBusy(false) }
  }

  const Grid = ({ entities, keyName, icon }: { entities: { id: number; name: string }[]; keyName: 'roomId' | 'trainerId'; icon: React.ReactNode }) => (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr>
            <th className="sticky start-0 z-10 w-[120px] border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground"></th>
            {DAYS.map((d) => (
              <th key={d} className="border-b border-s bg-muted/70 px-2 py-2.5 text-center text-xs font-bold text-muted-foreground">
                {t(`daysShort.${d}`)} <span className="tnum">{addDays(weekStart, d).getDate()}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entities.length === 0 && (
            <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">لا توجد جلسات في هذا الأسبوع</td></tr>
          )}
          {entities.map((ent) => (
            <tr key={ent.id} className="border-b last:border-0">
              <td className="sticky start-0 z-10 bg-card px-3 py-2 align-top">
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  <span className="text-primary">{icon}</span>
                  <span className="truncate">{ent.name}</span>
                </div>
              </td>
              {DAYS.map((d) => {
                const items = sessions
                  .filter((s) => s[keyName] === ent.id && parseISO(s.date).getDay() === d)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                return (
                  <td key={d} className="border-s px-1.5 py-1.5 align-top">
                    <div className="flex min-h-[64px] flex-col gap-1">
                      {items.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => openSession(s)}
                          className={cn('rounded-md border-s-4 px-1.5 py-1 text-start text-[10px] leading-tight', CHIP[s.status])}
                          title={`${s.sectionName} — ${hm(s.startTime)}–${hm(s.endTime)}`}
                        >
                          <div className={cn('tnum font-extrabold text-primary', s.status === 'Cancelled' && 'line-through')}>
                            {hm(s.startTime)}–{hm(s.endTime)}
                          </div>
                          <div className="truncate font-bold">{s.sectionName}</div>
                          <div className="truncate text-muted-foreground">
                            {keyName === 'roomId' ? s.trainerName : s.roomName}
                          </div>
                        </button>
                      ))}
                      {items.length === 0 && <span className="px-1 text-[10px] text-muted-foreground/50">{t('schedule.free')}</span>}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div>
      <PageHeader title={t('schedule.title')} subtitle={t('schedule.subtitle')} />

      {/* generate sessions */}
      <div className="mb-5 flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3 shadow-sm">
        <div className="min-w-[220px] flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />توليد جلسات شعبة من جدولها الأسبوعي (مرة واحدة لكل شعبة)
          </div>
          <select className={field} value={genId} onChange={(e) => setGenId(e.target.value)}>
            <option value="">اختر شعبة…</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <Button className="min-h-[40px]" disabled={!genId || genBusy} onClick={doGenerate}>
          {genBusy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}توليد الجلسات
        </Button>
      </div>

      {/* week nav */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="الأسبوع التالي" title="الأسبوع التالي" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
          <span className="tnum min-w-[260px] text-center text-sm font-extrabold">
            {weekLabel(weekStart)}
          </span>
          <Button variant="outline" size="icon" aria-label="الأسبوع السابق" title="الأسبوع السابق" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>هذا الأسبوع</Button>
      </div>

      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {dayLoad.map(({ day, count }) => (
          <div key={day} className="rounded-lg border bg-card p-2 text-center">
            <div className="text-[11px] font-bold text-muted-foreground">{t(`daysShort.${day}`)}</div>
            <div className="mx-auto mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxLoad) * 100}%` }} />
            </div>
            <div className="tnum mt-1 text-xs font-extrabold">{count}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="rooms" className="min-h-[44px] gap-2"><MapPin className="h-4 w-4" />{t('schedule.byRoom')}</TabsTrigger>
            <TabsTrigger value="trainers" className="min-h-[44px] gap-2"><Users2 className="h-4 w-4" />{t('schedule.byTrainer')}</TabsTrigger>
          </TabsList>
          <TabsContent value="rooms">
            <Grid entities={rows.rooms} keyName="roomId" icon={<MapPin className="h-3.5 w-3.5" />} />
          </TabsContent>
          <TabsContent value="trainers">
            <Grid entities={rows.trainers} keyName="trainerId" icon={<Users2 className="h-3.5 w-3.5" />} />
          </TabsContent>
        </Tabs>
      )}

      {/* session dialog */}
      <Dialog open={!!sel} onOpenChange={(o) => { if (!o) setSel(null) }}>
        <DialogContent>
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {sel.sectionName}
                  <Pill tone={STATUS_TONE[sel.status]}>{STATUS_AR[sel.status]}</Pill>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-1 text-sm">
                <div className="tnum">{sel.date} · {hm(sel.startTime)}–{hm(sel.endTime)}</div>
                <div>القاعة: <b>{sel.roomName}</b></div>
                <div>المدرب: <b>{sel.trainerName}</b></div>
                {sel.notes && <div className="whitespace-pre-line text-muted-foreground">{sel.notes}</div>}
              </div>

              {mode === 'postpone' && (
                <div className="space-y-2">
                  <input type="date" className={field} value={nd} onChange={(e) => setNd(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" className={field} value={ns} onChange={(e) => setNs(e.target.value)} />
                    <input type="time" className={field} value={ne} onChange={(e) => setNe(e.target.value)} />
                  </div>
                  <input className={field} placeholder="السبب (اختياري)" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              )}
              {mode === 'cancel' && (
                <input className={field} placeholder="سبب الإلغاء (اختياري)" value={reason} onChange={(e) => setReason(e.target.value)} />
              )}

              <DialogFooter className="gap-2">
                {sel.status === 'Scheduled' && mode === 'view' && (
                  <>
                    <Button variant="outline" onClick={() => setMode('postpone')}>تأجيل</Button>
                    <Button variant="destructive" onClick={() => setMode('cancel')}>إلغاء الجلسة</Button>
                  </>
                )}
                {mode === 'postpone' && (
                  <>
                    <Button variant="outline" onClick={() => setMode('view')}>رجوع</Button>
                    <Button disabled={busy || !nd || !ns || !ne} onClick={doPostpone}>
                      {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}تأكيد التأجيل
                    </Button>
                  </>
                )}
                {mode === 'cancel' && (
                  <>
                    <Button variant="outline" onClick={() => setMode('view')}>رجوع</Button>
                    <Button variant="destructive" disabled={busy} onClick={doCancel}>
                      {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}تأكيد الإلغاء
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}