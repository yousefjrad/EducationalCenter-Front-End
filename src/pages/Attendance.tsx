import { useMemo, useState } from 'react'
import { ClipboardCheck, Check, X, Users, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { useStore, activeEnrollmentsOf } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import type { AttendanceStatus, ClassSession } from '@/types'
import { fmtDate, timeRange, todayISO } from '@/lib/format'
import { PageHeader, EmptyState, Pill, Card, CardContent, CardHeader, CardTitle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AttendancePage() {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({})

  const sessions = useMemo(() => {
    const today = todayISO()
    return state.sessions
      .filter((s) => s.status !== 'cancelled' && s.date <= today)
      .map((s) => ({
        session: s,
        section: state.sections.find((x) => x.id === s.sectionId)!,
      }))
      .filter((x) => x.section && x.section.status !== 'cancelled')
      .sort((a, b) => b.session.date.localeCompare(a.session.date))
      .slice(0, 40)
  }, [state.sessions, state.sections])

  const selected = sessions.find((x) => x.session.id === selectedId)
  const students = selected ? activeEnrollmentsOf(state, selected.section.id) : []

  const pick = (s: ClassSession) => {
    setSelectedId(s.id)
    const existing: Record<number, AttendanceStatus> = {}
    state.attendance.filter((a) => a.sessionId === s.id).forEach((a) => { existing[a.studentId] = a.status })
    setMarks(existing)
  }

  const presentCount = Object.values(marks).filter((v) => v === 'present').length
  const absentCount = Object.values(marks).filter((v) => v === 'absent').length

  const save = () => {
    if (!selected) return
    const records = students.map((e) => ({
      studentId: e.studentId,
      status: marks[e.studentId] ?? ('absent' as AttendanceStatus),
    }))
    dispatch({ type: 'SET_ATTENDANCE', sessionId: selected.session.id, records })
    toast.success(t('att.saved'))
  }

  return (
    <div>
      <PageHeader title={t('att.title')} subtitle={t('att.subtitle')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* session list */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">{t('att.recentSessions')}</CardTitle>
          </CardHeader>
          <CardContent className="scrollbar-thin max-h-[70vh] space-y-2 overflow-y-auto">
            {sessions.length === 0 && <EmptyState message={t('dash.noSessions')} icon={<CalendarDays className="h-9 w-9" strokeWidth={1.2} />} />}
            {sessions.map(({ session, section }) => {
              const marked = state.attendance.some((a) => a.sessionId === session.id)
              return (
                <button
                  key={session.id}
                  onClick={() => pick(session)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-start transition-colors',
                    selectedId === session.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-extrabold">{section.title}</span>
                    {marked ? <Pill tone="green"><Check className="h-3 w-3" /></Pill> : session.status === 'postponed' ? <Pill tone="amber">{t('session.status.postponed')}</Pill> : <Pill tone="gray">{t('att.unmarked')}</Pill>}
                  </div>
                  <div className="tnum mt-1 text-xs text-muted-foreground">
                    {fmtDate(session.date)} · {timeRange(session.start, session.end)}
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* marking panel */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-extrabold">
              {selected ? selected.section.title : t('att.pickSession')}
            </CardTitle>
            {selected && students.length > 0 && (
              <div className="flex items-center gap-2">
                <Pill tone="green">{presentCount} {t('att.presentCount')}</Pill>
                <Pill tone="red">{absentCount} {t('att.absentCount')}</Pill>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selected && <EmptyState message={t('att.pickSession')} icon={<ClipboardCheck className="h-10 w-10" strokeWidth={1.2} />} />}
            {selected && students.length === 0 && <EmptyState message={t('att.empty')} icon={<Users className="h-9 w-9" strokeWidth={1.2} />} />}
            {selected && students.length > 0 && (
              <>
                <div className="mb-3 flex justify-end">
                  <Button
                    variant="outline" size="sm" className="min-h-[36px]"
                    onClick={() => {
                      const all: Record<number, AttendanceStatus> = {}
                      students.forEach((e) => { all[e.studentId] = 'present' })
                      setMarks(all)
                    }}
                  >
                    <Check className="me-1 h-3.5 w-3.5" />{t('att.markAllPresent')}
                  </Button>
                </div>
                <div className="space-y-2">
                  {students.map((e) => {
                    const st = state.students.find((x) => x.id === e.studentId)
                    const mark = marks[e.studentId]
                    return (
                      <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                        <span className="min-w-0 truncate font-bold">{st?.name}</span>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => setMarks({ ...marks, [e.studentId]: 'present' })}
                            className={cn(
                              'flex min-h-[44px] min-w-[88px] items-center justify-center gap-1.5 rounded-lg border text-sm font-bold transition-colors',
                              mark === 'present'
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                                : 'hover:bg-muted',
                            )}
                          >
                            <Check className="h-4 w-4" />{t('att.present')}
                          </button>
                          <button
                            onClick={() => setMarks({ ...marks, [e.studentId]: 'absent' })}
                            className={cn(
                              'flex min-h-[44px] min-w-[88px] items-center justify-center gap-1.5 rounded-lg border text-sm font-bold transition-colors',
                              mark === 'absent'
                                ? 'border-red-500 bg-red-100 text-red-800'
                                : 'hover:bg-muted',
                            )}
                          >
                            <X className="h-4 w-4" />{t('att.absent')}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Button className="mt-4 min-h-[44px] w-full" onClick={save}>
                  <ClipboardCheck className="me-2 h-4 w-4" />{t('att.saveAll')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
