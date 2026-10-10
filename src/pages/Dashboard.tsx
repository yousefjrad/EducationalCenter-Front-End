import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  GraduationCap, Layers, Wallet, AlarmClock, Armchair, Hourglass,
  CalendarDays, Plus, CreditCard, FolderPlus, Clock, MapPin,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useStore, activeEnrollmentsOf, monthlyRevenue, overdueInstallments, computedAlerts, isSectionFull } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import { fmtSYP, monthKey, monthLabel, todayISO } from '@/lib/format'
import { PageHeader, StatCard, Pill, Meter, EmptyState, Card, CardContent, CardHeader, CardTitle } from '@/components/shared'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { t, lang } = useI18n()
  const { state } = useStore()
  const navigate = useNavigate()
  const today = todayISO()
  const thisMonth = monthKey(today)

  const stats = useMemo(() => {
    const activeEnrolls = state.enrollments.filter((e) => e.status === 'active')
    const uniqueStudents = new Set(activeEnrolls.map((e) => e.studentId)).size
    const openSections = state.sections.filter((s) => s.status === 'open')
    const revenue = monthlyRevenue(state, thisMonth)
    const prev = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return monthKey(d.toISOString().slice(0, 10)) })()
    const prevRevenue = monthlyRevenue(state, prev)
    const delta = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null
    const seatsTotal = openSections.reduce((a, s) => a + s.capacity, 0)
    const seatsTaken = openSections.reduce((a, s) => a + activeEnrollmentsOf(state, s.id).length, 0)
    return {
      uniqueStudents,
      openCount: openSections.length,
      revenue, delta,
      overdue: overdueInstallments(state).length,
      waiting: state.waitingList.filter((w) => w.status === 'waiting').length,
      occupancy: seatsTotal > 0 ? Math.round((seatsTaken / seatsTotal) * 100) : 0,
      seatsTaken, seatsTotal,
    }
  }, [state, thisMonth])

  const chartData = useMemo(() => {
    const out: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const ym = monthKey(d.toISOString().slice(0, 10))
      out.push({ month: monthLabel(ym, lang), revenue: monthlyRevenue(state, ym) })
    }
    return out
  }, [state, lang])

  const todaySessions = useMemo(
    () =>
      state.sessions
        .filter((s) => s.date === today && s.status !== 'cancelled')
        .map((s) => ({ session: s, section: state.sections.find((x) => x.id === s.sectionId)! }))
        .filter((x) => x.section)
        .sort((a, b) => a.session.start.localeCompare(b.session.start)),
    [state, today],
  )

  const alerts = useMemo(
    () => computedAlerts(state).filter((a) => !state.dismissedAlerts.includes(a.key)).slice(0, 6),
    [state],
  )

  const openSections = state.sections.filter((s) => s.status === 'open')

  return (
    <div>
      <PageHeader
        title={t('dash.title')}
        subtitle={t('dash.subtitle')}
        actions={
          <>
            <Button variant="outline" className="min-h-[44px]" onClick={() => navigate('/payments?new=1')}>
              <CreditCard className="me-2 h-4 w-4" />{t('dash.quickPayment')}
            </Button>
            <Button variant="outline" className="min-h-[44px]" onClick={() => navigate('/sections?new=1')}>
              <FolderPlus className="me-2 h-4 w-4" />{t('dash.quickSection')}
            </Button>
            <Button className="min-h-[44px]" onClick={() => navigate('/students?enroll=1')}>
              <Plus className="me-2 h-4 w-4" />{t('dash.quickEnroll')}
            </Button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label={t('dash.activeStudents')} value={String(stats.uniqueStudents)} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label={t('dash.activeSections')} value={String(stats.openCount)} icon={<Layers className="h-5 w-5" />} tone="success" />
        <StatCard
          label={t('dash.monthRevenue')} value={fmtSYP(stats.revenue, lang)}
          hint={stats.delta !== null ? `${stats.delta >= 0 ? '+' : ''}${stats.delta}% ${t('dash.vsLastMonth')}` : undefined}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard label={t('dash.overdue')} value={String(stats.overdue)} icon={<AlarmClock className="h-5 w-5" />} tone={stats.overdue > 0 ? 'danger' : 'default'} />
        <StatCard label={t('dash.occupancy')} value={`${stats.occupancy}%`} hint={`${stats.seatsTaken}/${stats.seatsTotal} ${t('dash.seats')}`} icon={<Armchair className="h-5 w-5" />} tone="warning" />
        <StatCard label={t('dash.waiting')} value={String(stats.waiting)} icon={<Hourglass className="h-5 w-5" />} tone={stats.waiting > 0 ? 'warning' : 'default'} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* revenue chart */}
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-extrabold">{t('dash.revenueTrend')}</CardTitle>
            <Pill tone="teal">{t('dash.last6')}</Pill>
          </CardHeader>
          <CardContent>
            <div dir="ltr" className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(170 12% 88%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(175 8% 42%)' }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(175 8% 42%)' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${Math.round(v / 1000)}K`)}
                    width={44}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(168 30% 92% / 0.5)' }}
                    formatter={(v) => [fmtSYP(Number(v), lang), t('dash.monthRevenue')]}
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(170 12% 88%)', fontFamily: 'Tajawal', direction: 'rtl' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(172 78% 26%)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* today's sessions */}
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-extrabold">{t('dash.todaySessions')}</CardTitle>
            <Pill tone="blue">{todaySessions.length}</Pill>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySessions.length === 0 && <EmptyState message={t('dash.noSessions')} icon={<CalendarDays className="h-9 w-9" strokeWidth={1.2} />} />}
            {todaySessions.map(({ session, section }) => {
              const room = state.rooms.find((r) => r.id === section.roomId)
              const trainer = state.trainers.find((x) => x.id === section.trainerId)
              return (
                <Link
                  key={session.id} to="/attendance"
                  className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
                >
                  <div className="tnum flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                    <span className="text-sm leading-tight">{session.start}</span>
                    <span className="text-[10px] font-medium opacity-70">{session.end}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{section.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{room?.name}</span>
                      <span className="truncate">{trainer?.name}</span>
                    </div>
                  </div>
                  {session.status === 'postponed' && <Pill tone="amber">{t('session.status.postponed')}</Pill>}
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* occupancy */}
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">{t('dash.sectionOccupancy')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {openSections.map((sec) => {
              const enrolled = activeEnrollmentsOf(state, sec.id).length
              const full = isSectionFull(state, sec.id)
              return (
                <div key={sec.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-bold">{sec.title}</span>
                    <span className="tnum shrink-0 text-xs text-muted-foreground">
                      {enrolled}/{sec.capacity}
                      {full && <Pill tone="red" className="ms-2">{t('sections.full')}</Pill>}
                    </span>
                  </div>
                  <Meter value={enrolled} max={sec.capacity} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* alerts */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">{t('dash.alerts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 && <EmptyState message={t('dash.allClear')} />}
            {alerts.map((a) => (
              <button
                key={a.key}
                onClick={() => navigate(a.link)}
                className="flex w-full items-start gap-2.5 rounded-lg border p-3 text-start transition-colors hover:bg-muted/60"
              >
                <span className={a.type === 'overdue' ? 'mt-0.5 text-destructive' : 'mt-0.5 text-[hsl(var(--warning))]'}>
                  {a.type === 'overdue' ? <AlarmClock className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1 text-xs font-bold leading-relaxed">{a.text[lang]}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
