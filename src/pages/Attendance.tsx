import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ClipboardCheck, Loader2, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api, ApiError } from '@/services/api'
import { sessionsApi, type ClassSessionDto, type SessionStatus } from '@/services/sessions'
import { attendanceApi, type SessionAttendanceDto } from '@/services/attendance'

const L = {
  title: '\u0627\u0644\u062d\u0636\u0648\u0631',
  subtitle: '\u062a\u0633\u062c\u064a\u0644 \u062d\u0636\u0648\u0631 \u0627\u0644\u0637\u0644\u0627\u0628 \u0644\u0643\u0644 \u062c\u0644\u0633\u0629 (\u0645\u0646 \u0643\u0634\u0641 \u0627\u0644\u0645\u062f\u0631\u0628)',
  recent: '\u0627\u0644\u062c\u0644\u0633\u0627\u062a \u0627\u0644\u0623\u062e\u064a\u0631\u0629 (30 \u064a\u0648\u0645\u0627\u064b)',
  allSections: '\u0643\u0644 \u0627\u0644\u0634\u0639\u0628',
  noSessions: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062c\u0644\u0633\u0627\u062a \u0645\u062a\u0627\u062d\u0629 \u0644\u0644\u062a\u0633\u062c\u064a\u0644',
  pick: '\u0627\u062e\u062a\u0631 \u062c\u0644\u0633\u0629 \u0644\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062d\u0636\u0648\u0631',
  emptyRoster: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0637\u0644\u0627\u0628 \u0645\u0633\u062c\u0644\u0648\u0646 \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0634\u0639\u0628\u0629',
  present: '\u062d\u0627\u0636\u0631',
  absent: '\u063a\u0627\u0626\u0628',
  presentCount: '\u062d\u0627\u0636\u0631',
  absentCount: '\u063a\u0627\u0626\u0628',
  markAll: '\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0643\u0644 \u062d\u0627\u0636\u0631\u0627\u064b',
  save: '\u062d\u0641\u0638 \u0627\u0644\u062d\u0636\u0648\u0631',
  saved: '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062d\u0636\u0648\u0631',
  unmarkedNote: '\u0627\u0644\u0637\u0644\u0627\u0628 \u063a\u064a\u0631 \u0627\u0644\u0645\u062d\u062f\u062f\u064a\u0646 \u064a\u064f\u062d\u0641\u0638\u0648\u0646 \u0643\u063a\u0627\u0626\u0628\u064a\u0646.',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
}

const ST_AR: Record<SessionStatus, string> = {
  Scheduled: '\u0645\u062c\u062f\u0648\u0644\u0629', Held: '\u0645\u0646\u0639\u0642\u062f\u0629', Postponed: '\u0645\u0624\u062c\u0644\u0629', Cancelled: '\u0645\u0644\u063a\u0627\u0629',
}
const ST_TONE: Record<SessionStatus, 'teal' | 'green' | 'amber' | 'red'> = {
  Scheduled: 'teal', Held: 'green', Postponed: 'amber', Cancelled: 'red',
}

interface SectionLite { id: number; name: string }

const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const hm = (t: string) => t.slice(0, 5)
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default function AttendancePage() {
  const [sessions, setSessions] = useState<ClassSessionDto[]>([])
  const [sections, setSections] = useState<SectionLite[]>([])
  const [sectionId, setSectionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const [selId, setSelId] = useState<number | null>(null)
  const [detail, setDetail] = useState<SessionAttendanceDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [marks, setMarks] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(api.get('/sections?pageSize=100') as Promise<{ items: SectionLite[] }>)
      .then((r) => setSections(r.items))
      .catch(() => { /* ignore */ })
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    sessionsApi
      .list({ from: iso(from), to: iso(now), sectionId: sectionId ? Number(sectionId) : undefined, pageSize: 100 })
      .then((r) => { if (alive) setSessions(r.items) })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [sectionId, reloadKey])

  const list = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'Scheduled' || s.status === 'Held')
        .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)),
    [sessions],
  )

  useEffect(() => {
    if (selId === null) { setDetail(null); return }
    let alive = true
    setDetailLoading(true)
    attendanceApi
      .getSession(selId)
      .then((d) => {
        if (!alive) return
        setDetail(d)
        const m: Record<number, boolean> = {}
        d.rows.forEach((r) => { if (r.isPresent !== null) m[r.enrollmentId] = r.isPresent })
        setMarks(m)
      })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setDetailLoading(false) })
    return () => { alive = false }
  }, [selId])

  const presentCount = Object.values(marks).filter((v) => v).length
  const absentCount = Object.values(marks).filter((v) => !v).length

  const save = async () => {
    if (!detail) return
    setSaving(true)
    try {
      const payload = detail.rows.map((r) => ({ enrollmentId: r.enrollmentId, isPresent: marks[r.enrollmentId] ?? false }))
      const d = await attendanceApi.record(detail.sessionId, payload)
      setDetail(d)
      const m: Record<number, boolean> = {}
      d.rows.forEach((r) => { if (r.isPresent !== null) m[r.enrollmentId] = r.isPresent })
      setMarks(m)
      toast.success(L.saved)
      setReloadKey((k) => k + 1)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* sessions */}
        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 text-base font-extrabold">{L.recent}</div>
          <select className={cn(field, 'mb-3')} value={sectionId} onChange={(e) => { setSectionId(e.target.value); setSelId(null) }}>
            <option value="">{L.allSections}</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="scrollbar-thin max-h-[65vh] space-y-2 overflow-y-auto">
            {loading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                <CalendarDays className="h-9 w-9" strokeWidth={1.2} />{L.noSessions}
              </div>
            )}
            {list.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelId(s.id)}
                className={cn('w-full rounded-xl border p-3 text-start transition-colors', selId === s.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold">{s.sectionName}</span>
                  <Pill tone={ST_TONE[s.status]}>{ST_AR[s.status]}</Pill>
                </div>
                <div className="tnum mt-1 text-xs text-muted-foreground">{s.date} - {hm(s.startTime)}-{hm(s.endTime)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* roster */}
        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-base font-extrabold">{detail ? detail.sectionName : L.pick}</div>
            {detail && detail.rows.length > 0 && (
              <div className="flex items-center gap-2">
                <Pill tone="green">{presentCount} {L.presentCount}</Pill>
                <Pill tone="red">{absentCount} {L.absentCount}</Pill>
              </div>
            )}
          </div>

          {detailLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {!detailLoading && !detail && (
            <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
              <ClipboardCheck className="h-10 w-10" strokeWidth={1.2} />{L.pick}
            </div>
          )}
          {!detailLoading && detail && detail.rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
              <Users className="h-9 w-9" strokeWidth={1.2} />{L.emptyRoster}
            </div>
          )}
          {!detailLoading && detail && detail.rows.length > 0 && (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{L.unmarkedNote}</span>
                <Button variant="outline" size="sm" className="min-h-[36px]"
                  onClick={() => { const all: Record<number, boolean> = {}; detail.rows.forEach((r) => { all[r.enrollmentId] = true }); setMarks(all) }}>
                  <Check className="me-1 h-3.5 w-3.5" />{L.markAll}
                </Button>
              </div>
              <div className="space-y-2">
                {detail.rows.map((r) => {
                  const mark = marks[r.enrollmentId]
                  return (
                    <div key={r.enrollmentId} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                      <span className="min-w-0 truncate font-bold">{r.studentName}</span>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setMarks({ ...marks, [r.enrollmentId]: true })}
                          className={cn('flex min-h-[44px] min-w-[88px] items-center justify-center gap-1.5 rounded-lg border text-sm font-bold transition-colors',
                            mark === true ? 'border-emerald-500 bg-emerald-100 text-emerald-800' : 'hover:bg-muted')}
                        >
                          <Check className="h-4 w-4" />{L.present}
                        </button>
                        <button
                          onClick={() => setMarks({ ...marks, [r.enrollmentId]: false })}
                          className={cn('flex min-h-[44px] min-w-[88px] items-center justify-center gap-1.5 rounded-lg border text-sm font-bold transition-colors',
                            mark === false ? 'border-red-500 bg-red-100 text-red-800' : 'hover:bg-muted')}
                        >
                          <X className="h-4 w-4" />{L.absent}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button className="mt-4 min-h-[44px] w-full" disabled={saving} onClick={save}>
                {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="me-2 h-4 w-4" />}{L.save}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}