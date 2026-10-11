import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  GraduationCap, Layers, Wallet, AlarmClock, Armchair, Hourglass,
  CalendarDays, Plus, CreditCard, FolderPlus, Clock, MapPin, Loader2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { PageHeader, StatCard, Pill, Meter, EmptyState, Card, CardContent, CardHeader, CardTitle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { sessionsApi, type ClassSessionDto } from '@/services/sessions'
import type { MonthlyRevenueReport, OccupancyReport, OverdueRow } from '@/services/reports'

const L = {
  title: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
  subtitle: '\u0646\u0638\u0631\u0629 \u0633\u0631\u064a\u0639\u0629 \u0639\u0644\u0649 \u0646\u0634\u0627\u0637 \u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u064a\u0648\u0645',
  quickPayment: '\u062a\u0633\u062c\u064a\u0644 \u062f\u0641\u0639\u0629',
  quickSection: '\u0634\u0639\u0628\u0629 \u062c\u062f\u064a\u062f\u0629',
  quickEnroll: '\u062a\u0633\u062c\u064a\u0644 \u0637\u0627\u0644\u0628',
  students: '\u0627\u0644\u0637\u0644\u0627\u0628',
  sections: '\u0627\u0644\u0634\u0639\u0628 \u0627\u0644\u0646\u0634\u0637\u0629',
  monthRevenue: '\u0625\u064a\u0631\u0627\u062f \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631',
  vsLast: '\u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u0645\u0627\u0636\u064a',
  overdue: '\u0623\u0642\u0633\u0627\u0637 \u0645\u062a\u0623\u062e\u0631\u0629',
  occupancy: '\u0646\u0633\u0628\u0629 \u0627\u0644\u0625\u0634\u063a\u0627\u0644',
  seats: '\u0645\u0642\u0639\u062f',
  waiting: '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
  trend: '\u0627\u0644\u0625\u064a\u0631\u0627\u062f \u0627\u0644\u0634\u0647\u0631\u064a',
  last6: '\u0622\u062e\u0631 6 \u0623\u0634\u0647\u0631',
  todaySessions: '\u062d\u0635\u0635 \u0627\u0644\u064a\u0648\u0645',
  noSessions: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0635\u0635 \u0627\u0644\u064a\u0648\u0645',
  sectionOcc: '\u0625\u0634\u063a\u0627\u0644 \u0627\u0644\u0634\u0639\u0628',
  full: '\u0645\u0645\u062a\u0644\u0626\u0629',
  alerts: '\u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a',
  allClear: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0646\u0628\u064a\u0647\u0627\u062a',
  currency: '\u0644.\u0633',
  postponed: '\u0645\u0624\u062c\u0644\u0629',
  held: '\u0645\u0646\u0639\u0642\u062f\u0629',
  noAccess: '\u063a\u064a\u0631 \u0645\u062a\u0627\u062d \u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a\u0643',
  alOverdue: '\u0642\u0633\u0637 \u0645\u062a\u0623\u062e\u0631',
  alDays: '\u064a\u0648\u0645',
  alHold: '\u062d\u062c\u0632 \u0645\u0642\u0639\u062f \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u062a\u0623\u0643\u064a\u062f',
  alExpired: '\u0627\u0646\u062a\u0647\u062a \u0645\u062f\u0629 \u0627\u0644\u062d\u062c\u0632',
  alWaiting: '\u0645\u0642\u0639\u062f \u0634\u0627\u063a\u0631 \u0648\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u062a\u0631\u0642\u064a\u0629',
}

const pad = (n: number) => String(n).padStart(2, '0')
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const hm = (s: string) => s.slice(0, 5)

interface AlertsDto {
  overdueInstallments: { count: number; totalRemainingInSyp: number; items: OverdueRow[] } | null
  pendingEnrollments: {
    count: number; expiredCount: number
    items: { enrollmentId: number; studentName: string; sectionName: string; isExpired: boolean }[]
  } | null
  waitingList: {
    count: number
    items: { sectionId: number; sectionName: string; waitingCount: number; firstStudentName: string }[]
  } | null
  totalCount: number
}

function useData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!path) { setLoading(false); return }
    let alive = true
    ;(api.get(path) as Promise<T>)
      .then((r) => { if (alive) setData(r) })
      .catch(() => { if (alive) setData(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [path])
  return { data, loading }
}

interface AlertRow { key: string; text: string; link: string; kind: 'overdue' | 'other' }

export default function Dashboard() {
  const navigate = useNavigate()
  const now = new Date()
  const today = isoDay(now)
  const from6 = isoDay(new Date(now.getFullYear(), now.getMonth() - 5, 1))

  const rev = useData<MonthlyRevenueReport>(`/reports/financial/monthly-revenue?from=${from6}&to=${today}`)
  const occ = useData<OccupancyReport>('/reports/operational/section-occupancy')
  const alerts = useData<AlertsDto>('/alerts')
  const studs = useData<{ items: unknown[]; totalCount?: number; total?: number }>('/students?pageSize=1')

  const [sessions, setSessions] = useState<ClassSessionDto[]>([])
  const [sesLoading, setSesLoading] = useState(true)
  useEffect(() => {
    let alive = true
    sessionsApi
      .list({ from: today, to: today, page: 1, pageSize: 100 })
      .then((r) => { if (alive) setSessions((r as { items: ClassSessionDto[] }).items.filter((s) => s.status !== 'Cancelled')) })
      .catch(() => { /* hidden */ })
      .finally(() => { if (alive) setSesLoading(false) })
    return () => { alive = false }
  }, [today])

  // revenue chart: always the last 6 months, missing months = 0
  const months: { key: string; label: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const row = rev.data?.rows.find((r) => r.year === d.getFullYear() && r.month === d.getMonth() + 1)
    months.push({ key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${pad(d.getMonth() + 1)}/${d.getFullYear()}`, revenue: row?.totalInSyp ?? 0 })
  }
  const thisRev = months[5].revenue
  const prevRev = months[4].revenue
  const delta = prevRev > 0 ? Math.round(((thisRev - prevRev) / prevRev) * 100) : null

  const o = occ.data
  const occPct = o && o.totalCapacity > 0 ? Math.round((o.totalSeatsTaken / o.totalCapacity) * 100) : 0
  const studentsTotal = studs.data ? (studs.data.totalCount ?? studs.data.total ?? studs.data.items.length) : null
  const overdueCount = alerts.data?.overdueInstallments?.count ?? null

  const rows: AlertRow[] = []
  alerts.data?.overdueInstallments?.items.slice(0, 4).forEach((x) =>
    rows.push({ key: `o${x.installmentId}`, link: '/payments', kind: 'overdue',
      text: `${x.studentName} - ${x.sectionName} - ${L.alOverdue} #${x.installmentNumber} (${x.daysOverdue} ${L.alDays})` }))
  alerts.data?.pendingEnrollments?.items.slice(0, 3).forEach((x) =>
    rows.push({ key: `p${x.enrollmentId}`, link: '/enrollments', kind: 'other',
      text: `${x.studentName} - ${x.sectionName} - ${x.isExpired ? L.alExpired : L.alHold}` }))
  alerts.data?.waitingList?.items.slice(0, 3).forEach((x) =>
    rows.push({ key: `w${x.sectionId}`, link: '/enrollments', kind: 'other',
      text: `${x.sectionName}: ${L.alWaiting} (${x.firstStudentName}, ${x.waitingCount})` }))

  const sortedSessions = [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const na = L.noAccess

  return (
    <div>
      <PageHeader
        title={L.title}
        subtitle={L.subtitle}
        actions={
          <>
            <Button variant="outline" className="min-h-[44px]" onClick={() => navigate('/payments?new=1')}>
              <CreditCard className="me-2 h-4 w-4" />{L.quickPayment}
            </Button>
            <Button variant="outline" className="min-h-[44px]" onClick={() => navigate('/sections?new=1')}>
              <FolderPlus className="me-2 h-4 w-4" />{L.quickSection}
            </Button>
            <Button className="min-h-[44px]" onClick={() => navigate('/enrollments')}>
              <Plus className="me-2 h-4 w-4" />{L.quickEnroll}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label={L.students} value={studentsTotal === null ? '-' : String(studentsTotal)} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label={L.sections} value={o ? String(o.rows.length) : '-'} icon={<Layers className="h-5 w-5" />} tone="success" />
        <StatCard
          label={L.monthRevenue} value={rev.data ? `${n0(thisRev)} ${L.currency}` : '-'}
          hint={rev.data ? (delta !== null ? `${delta >= 0 ? '+' : ''}${delta}% ${L.vsLast}` : undefined) : na}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard label={L.overdue} value={overdueCount === null ? '-' : String(overdueCount)} icon={<AlarmClock className="h-5 w-5" />} tone={overdueCount ? 'danger' : 'default'} />
        <StatCard label={L.occupancy} value={o ? `${occPct}%` : '-'} hint={o ? `${o.totalSeatsTaken}/${o.totalCapacity} ${L.seats}` : na} icon={<Armchair className="h-5 w-5" />} tone="warning" />
        <StatCard label={L.waiting} value={o ? String(o.totalWaiting) : '-'} icon={<Hourglass className="h-5 w-5" />} tone={o && o.totalWaiting > 0 ? 'warning' : 'default'} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-extrabold">{L.trend}</CardTitle>
            <Pill tone="teal">{L.last6}</Pill>
          </CardHeader>
          <CardContent>
            {rev.loading ? (
              <div className="flex h-[260px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !rev.data ? (
              <EmptyState message={na} />
            ) : (
              <div dir="ltr" className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(170 12% 88%)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(175 8% 42%)' }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(175 8% 42%)' }} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${Math.round(v / 1000)}K`)}
                      width={44}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(168 30% 92% / 0.5)' }}
                      formatter={(v) => [`${n0(Number(v))} ${L.currency}`, L.monthRevenue]}
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(170 12% 88%)', fontFamily: 'Tajawal', direction: 'rtl' }}
                    />
                    <Bar dataKey="revenue" fill="hsl(172 78% 26%)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-extrabold">{L.todaySessions}</CardTitle>
            <Pill tone="blue">{sortedSessions.length}</Pill>
          </CardHeader>
          <CardContent className="space-y-3">
            {sesLoading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            {!sesLoading && sortedSessions.length === 0 && <EmptyState message={L.noSessions} icon={<CalendarDays className="h-9 w-9" strokeWidth={1.2} />} />}
            {sortedSessions.map((s) => (
              <Link
                key={s.id} to="/attendance"
                className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <div className="tnum flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                  <span className="text-sm leading-tight">{hm(s.startTime)}</span>
                  <span className="text-[10px] font-medium opacity-70">{hm(s.endTime)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{s.sectionName}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.roomName}</span>
                    <span className="truncate">{s.trainerName}</span>
                  </div>
                </div>
                {s.status === 'Postponed' && <Pill tone="amber">{L.postponed}</Pill>}
                {s.status === 'Held' && <Pill tone="green">{L.held}</Pill>}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader><CardTitle className="text-base font-extrabold">{L.sectionOcc}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {occ.loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            {!occ.loading && !o && <EmptyState message={na} />}
            {o?.rows.map((r) => (
              <div key={r.sectionId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-bold">{r.sectionName}</span>
                  <span className="tnum shrink-0 text-xs text-muted-foreground">
                    {r.seatsTaken}/{r.capacity}
                    {r.vacantSeats === 0 && <Pill tone="red" className="ms-2">{L.full}</Pill>}
                  </span>
                </div>
                <Meter value={r.seatsTaken} max={r.capacity} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-extrabold">{L.alerts}</CardTitle>
            {alerts.data && <Pill tone={alerts.data.totalCount > 0 ? 'amber' : 'gray'}>{alerts.data.totalCount}</Pill>}
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            {!alerts.loading && rows.length === 0 && <EmptyState message={L.allClear} />}
            {rows.map((a) => (
              <button
                key={a.key}
                onClick={() => navigate(a.link)}
                className="flex w-full items-start gap-2.5 rounded-lg border p-3 text-start transition-colors hover:bg-muted/60"
              >
                <span className={a.kind === 'overdue' ? 'mt-0.5 text-destructive' : 'mt-0.5 text-[hsl(var(--warning))]'}>
                  {a.kind === 'overdue' ? <AlarmClock className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1 text-xs font-bold leading-relaxed">{a.text}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}