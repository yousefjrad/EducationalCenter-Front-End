import { useEffect, useState, type ReactNode } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, ApiError } from '@/services/api'
import {
  downloadReport, qs, reportsApi,
  type MonthlyRevenueReport, type NetProfitReport, type OccupancyReport,
  type OverdueReport, type ScheduleReport, type StudentBalancesReport,
} from '@/services/reports'

const L = {
  title: '\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631',
  subtitle: '\u062a\u0642\u0627\u0631\u064a\u0631 \u0645\u0627\u0644\u064a\u0629 \u0648\u062a\u0634\u063a\u064a\u0644\u064a\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645',
  fin: '\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0645\u0627\u0644\u064a\u0629',
  ops: '\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629',
  from: '\u0645\u0646 \u062a\u0627\u0631\u064a\u062e',
  to: '\u0625\u0644\u0649 \u062a\u0627\u0631\u064a\u062e',
  asOf: '\u062d\u062a\u0649 \u062a\u0627\u0631\u064a\u062e',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a',
  total: '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a',
  month: '\u0627\u0644\u0634\u0647\u0631',
  payments: '\u0639\u062f\u062f \u0627\u0644\u062f\u0641\u0639\u0627\u062a',
  recSyp: '\u0627\u0644\u0645\u0642\u0628\u0648\u0636 \u0628\u0627\u0644\u0644\u064a\u0631\u0629',
  recUsd: '\u0627\u0644\u0645\u0642\u0628\u0648\u0636 \u0628\u0627\u0644\u062f\u0648\u0644\u0627\u0631',
  usdVal: '\u0642\u064a\u0645\u0629 \u0627\u0644\u062f\u0648\u0644\u0627\u0631 \u0628\u0627\u0644\u0644\u064a\u0631\u0629',
  totalSyp: '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0628\u0627\u0644\u0644\u064a\u0631\u0629',
  monthly: '\u0627\u0644\u0625\u064a\u0631\u0627\u062f \u0627\u0644\u0634\u0647\u0631\u064a',
  net: '\u0635\u0627\u0641\u064a \u0627\u0644\u0631\u0628\u062d (\u0623\u0633\u0627\u0633 \u0646\u0642\u062f\u064a)',
  revenue: '\u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a',
  expenses: '\u0627\u0644\u0645\u0635\u0627\u0631\u064a\u0641',
  payroll: '\u0631\u0648\u0627\u062a\u0628 \u0627\u0644\u0645\u062f\u0631\u0628\u064a\u0646 \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0629',
  netProfit: '\u0635\u0627\u0641\u064a \u0627\u0644\u0631\u0628\u062d',
  byCat: '\u0627\u0644\u0645\u0635\u0627\u0631\u064a\u0641 \u062d\u0633\u0628 \u0627\u0644\u062a\u0635\u0646\u064a\u0641',
  balances: '\u0627\u0644\u0623\u0631\u0635\u062f\u0629 \u0627\u0644\u0645\u062a\u0628\u0642\u064a\u0629 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0627\u0628',
  overdue: '\u0627\u0644\u0623\u0642\u0633\u0627\u0637 \u0627\u0644\u0645\u062a\u0623\u062e\u0631\u0629',
  student: '\u0627\u0644\u0637\u0627\u0644\u0628',
  phone: '\u0627\u0644\u0647\u0627\u062a\u0641',
  section: '\u0627\u0644\u0634\u0639\u0628\u0629',
  course: '\u0627\u0644\u062f\u0648\u0631\u0629',
  agreed: '\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u062a\u0641\u0642',
  paid: '\u0627\u0644\u0645\u062f\u0641\u0648\u0639',
  remaining: '\u0627\u0644\u0645\u062a\u0628\u0642\u064a',
  inst: '\u0627\u0644\u0642\u0633\u0637',
  due: '\u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642',
  days: '\u0623\u064a\u0627\u0645 \u0627\u0644\u062a\u0623\u062e\u064a\u0631',
  amount: '\u0627\u0644\u0645\u0628\u0644\u063a',
  occupancy: '\u0625\u0634\u063a\u0627\u0644 \u0627\u0644\u0634\u0639\u0628',
  status: '\u0627\u0644\u062d\u0627\u0644\u0629',
  allActive: '\u0627\u0644\u0634\u0639\u0628 \u0627\u0644\u0646\u0634\u0637\u0629',
  trainer: '\u0627\u0644\u0645\u062f\u0631\u0628',
  room: '\u0627\u0644\u0642\u0627\u0639\u0629',
  capacity: '\u0627\u0644\u0633\u0639\u0629',
  taken: '\u0627\u0644\u0645\u0633\u062c\u0644\u0648\u0646',
  vacant: '\u0627\u0644\u0634\u0627\u063a\u0631',
  waiting: '\u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
  roomSch: '\u062c\u062f\u0648\u0644 \u0642\u0627\u0639\u0629',
  trSch: '\u062c\u062f\u0648\u0644 \u0645\u062f\u0631\u0628',
  pickRoom: '\u0627\u062e\u062a\u0631 \u0642\u0627\u0639\u0629',
  pickTrainer: '\u0627\u062e\u062a\u0631 \u0645\u062f\u0631\u0628\u0627\u064b',
  date: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
  time: '\u0627\u0644\u0648\u0642\u062a',
  loadErr: '\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u0642\u0631\u064a\u0631',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
  excel: 'Excel',
  pdf: 'PDF',
  exported: '\u062a\u0645 \u062a\u0646\u0632\u064a\u0644 \u0627\u0644\u0645\u0644\u0641',
}

const SEC_ST: Record<string, string> = {
  Draft: '\u0645\u0633\u0648\u062f\u0629', OpenForEnrollment: '\u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0645\u0641\u062a\u0648\u062d', InProgress: '\u062c\u0627\u0631\u064a\u0629', Completed: '\u0645\u0643\u062a\u0645\u0644\u0629', Cancelled: '\u0645\u0644\u063a\u0627\u0629',
}
const SES_ST: Record<string, string> = { Scheduled: '\u0645\u062c\u062f\u0648\u0644\u0629', Held: '\u0645\u0646\u0639\u0642\u062f\u0629', Postponed: '\u0645\u0624\u062c\u0644\u0629', Cancelled: '\u0645\u0644\u063a\u0627\u0629' }

const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const pad = (n: number) => String(n).padStart(2, '0')
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hm = (s: string) => s.slice(0, 5)

function useData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!path) { setData(null); setError(''); return }
    let alive = true
    setLoading(true)
    setError('')
    reportsApi
      .get<T>(path)
      .then((r) => { if (alive) setData(r) })
      .catch((e) => { if (alive) { setData(null); setError(e instanceof ApiError ? e.message : L.loadErr) } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [path])
  return { data, loading, error }
}

function ExportBtns({ path, name }: { path: string | null; name: string }) {
  const [busy, setBusy] = useState<'' | 'Excel' | 'Pdf'>('')
  const go = async (fmt: 'Excel' | 'Pdf') => {
    if (!path) return
    setBusy(fmt)
    try {
      await downloadReport(`${path}&format=${fmt}&language=ar`, `${name}.${fmt === 'Excel' ? 'xlsx' : 'pdf'}`)
      toast.success(L.exported)
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : L.err)
    } finally {
      setBusy('')
    }
  }
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={!path || busy !== ''} onClick={() => go('Excel')}>
        {busy === 'Excel' ? <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" /> : <Download className="me-1 h-3.5 w-3.5" />}{L.excel}
      </Button>
      <Button variant="outline" size="sm" disabled={!path || busy !== ''} onClick={() => go('Pdf')}>
        {busy === 'Pdf' ? <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" /> : <Download className="me-1 h-3.5 w-3.5" />}{L.pdf}
      </Button>
    </div>
  )
}

function Box({ title, badge, actions, children }: { title: string; badge?: number; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-base font-extrabold">{title}{badge !== undefined && <Pill tone="amber" className="ms-2">{badge}</Pill>}</div>
        {actions}
      </div>
      {children}
    </div>
  )
}

function State({ loading, error, empty }: { loading: boolean; error: string; empty: boolean }) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  if (error) return <div className="py-6 text-center text-sm text-destructive">{error}</div>
  if (empty) return <div className="py-6 text-center text-sm text-muted-foreground">{L.empty}</div>
  return null
}

function Tbl({ heads, min, children }: { heads: string[]; min: number; children: ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse" style={{ minWidth: min }}>
        <thead><tr>{heads.map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Financial() {
  const now = new Date()
  const [from, setFrom] = useState(isoDay(new Date(now.getFullYear(), now.getMonth() - 5, 1)))
  const [to, setTo] = useState(isoDay(now))
  const [asOf, setAsOf] = useState(isoDay(now))
  const okRange = !!from && !!to && from <= to
  const rangeQ = okRange ? qs({ from, to }) : null

  const rev = useData<MonthlyRevenueReport>(rangeQ ? `/reports/financial/monthly-revenue?${rangeQ}` : null)
  const net = useData<NetProfitReport>(rangeQ ? `/reports/financial/net-profit?${rangeQ}` : null)
  const bal = useData<StudentBalancesReport>('/reports/financial/student-balances')
  const od = useData<OverdueReport>(asOf ? `/reports/financial/overdue-installments?${qs({ asOf })}` : null)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <div><div className="mb-1 text-xs text-muted-foreground">{L.from}</div><input type="date" className={field} value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><div className="mb-1 text-xs text-muted-foreground">{L.to}</div><input type="date" className={field} value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>

      <Box title={L.monthly} actions={<ExportBtns path={rangeQ ? `/reports/financial/export?kind=MonthlyRevenue&${rangeQ}` : null} name="monthly-revenue" />}>
        <State loading={rev.loading} error={rev.error} empty={!!rev.data && rev.data.rows.length === 0} />
        {rev.data && rev.data.rows.length > 0 && (
          <Tbl heads={[L.month, L.payments, L.recSyp, L.recUsd, L.usdVal, L.totalSyp]} min={640}>
            {rev.data.rows.map((r) => (
              <tr key={`${r.year}-${r.month}`}>
                <td className={td}><b className="tnum">{r.year}-{pad(r.month)}</b></td>
                <td className={td}><span className="tnum">{r.paymentsCount}</span></td>
                <td className={td}><span className="tnum">{n0(r.receivedInSyp)}</span></td>
                <td className={td}><span className="tnum" dir="ltr">${r.receivedInUsd}</span></td>
                <td className={td}><span className="tnum">{n0(r.usdValueInSyp)}</span></td>
                <td className={td}><b className="tnum">{n0(r.totalInSyp)}</b></td>
              </tr>
            ))}
            <tr>
              <td className={td}><b>{L.total}</b></td>
              <td className={td}><b className="tnum">{rev.data.totalPayments}</b></td>
              <td className={td} colSpan={3}></td>
              <td className={td}><b className="tnum text-primary">{n0(rev.data.totalInSyp)}</b></td>
            </tr>
          </Tbl>
        )}
      </Box>

      <Box title={L.net} actions={<ExportBtns path={rangeQ ? `/reports/financial/export?kind=NetProfit&${rangeQ}` : null} name="net-profit" />}>
        <State loading={net.loading} error={net.error} empty={false} />
        {net.data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                [L.revenue, net.data.revenueInSyp, 'text-[hsl(var(--success))]'],
                [L.expenses, net.data.expensesInSyp, 'text-destructive'],
                [L.payroll, net.data.trainerPayrollInSyp, 'text-destructive'],
                [L.netProfit, net.data.netProfitInSyp, net.data.netProfitInSyp >= 0 ? 'text-primary' : 'text-destructive'],
              ].map(([label, v, cls]) => (
                <div key={label as string} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{label as string}</div>
                  <div className={`tnum text-lg font-extrabold ${cls as string}`}>{n0(v as number)}</div>
                </div>
              ))}
            </div>
            {net.data.expensesByCategory.length > 0 && (
              <div>
                <div className="mb-1 text-sm font-bold">{L.byCat}</div>
                <div className="flex flex-wrap gap-2">
                  {net.data.expensesByCategory.map((c) => (
                    <Pill key={c.category} tone="blue">{c.category}: <span className="tnum">{n0(c.totalInSyp)}</span></Pill>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Box>

      <Box title={L.balances} badge={bal.data?.rows.length} actions={<ExportBtns path="/reports/financial/export?kind=StudentBalances" name="student-balances" />}>
        <State loading={bal.loading} error={bal.error} empty={!!bal.data && bal.data.rows.length === 0} />
        {bal.data && bal.data.rows.length > 0 && (
          <Tbl heads={[L.student, L.phone, L.section, L.agreed, L.paid, L.remaining]} min={760}>
            {bal.data.rows.map((r) => (
              <tr key={r.enrollmentId}>
                <td className={td}><b>{r.studentName}</b></td>
                <td className={td}><span className="tnum" dir="ltr">{r.phoneNumber}</span></td>
                <td className={td}>{r.sectionName}<div className="text-[11px] text-muted-foreground">{r.courseName}</div></td>
                <td className={td}><span className="tnum">{n0(r.agreedPrice)}</span></td>
                <td className={td}><span className="tnum">{n0(r.paidInSyp)}</span></td>
                <td className={td}><b className="tnum text-destructive">{n0(r.remainingInSyp)}</b></td>
              </tr>
            ))}
            <tr>
              <td className={td} colSpan={5}><b>{L.total}</b></td>
              <td className={td}><b className="tnum text-destructive">{n0(bal.data.totalRemainingInSyp)}</b></td>
            </tr>
          </Tbl>
        )}
      </Box>

      <Box
        title={L.overdue} badge={od.data?.rows.length}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className="h-9 rounded-md border bg-background px-2 text-sm" title={L.asOf} value={asOf} onChange={(e) => setAsOf(e.target.value)} />
            <ExportBtns path={asOf ? `/reports/financial/export?kind=OverdueInstallments&${qs({ asOf })}` : null} name="overdue-installments" />
          </div>
        }
      >
        <State loading={od.loading} error={od.error} empty={!!od.data && od.data.rows.length === 0} />
        {od.data && od.data.rows.length > 0 && (
          <Tbl heads={[L.student, L.phone, L.section, L.inst, L.due, L.days, L.remaining]} min={820}>
            {od.data.rows.map((r) => (
              <tr key={r.installmentId}>
                <td className={td}><b>{r.studentName}</b></td>
                <td className={td}><span className="tnum" dir="ltr">{r.phoneNumber}</span></td>
                <td className={td}>{r.sectionName}</td>
                <td className={td}><span className="tnum">#{r.installmentNumber}</span></td>
                <td className={td}><span className="tnum">{r.dueDate.slice(0, 10)}</span></td>
                <td className={td}><Pill tone="red">{r.daysOverdue}</Pill></td>
                <td className={td}><b className="tnum text-destructive">{n0(r.remainingInSyp)}</b></td>
              </tr>
            ))}
            <tr>
              <td className={td} colSpan={6}><b>{L.total}</b></td>
              <td className={td}><b className="tnum text-destructive">{n0(od.data.totalRemainingInSyp)}</b></td>
            </tr>
          </Tbl>
        )}
      </Box>
    </div>
  )
}

interface Opt { id: number; label: string }

function ScheduleBox({ kind }: { kind: 'room' | 'trainer' }) {
  const now = new Date()
  const [opts, setOpts] = useState<Opt[]>([])
  const [sel, setSel] = useState('')
  const [from, setFrom] = useState(isoDay(now))
  const [to, setTo] = useState(isoDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30)))

  useEffect(() => {
    const path = kind === 'room' ? '/rooms?pageSize=100' : '/trainers?pageSize=100'
    ;(api.get(path) as Promise<unknown>)
      .then((r) => {
        const arr = (Array.isArray(r) ? r : (r as { items?: unknown[] }).items ?? []) as Record<string, unknown>[]
        setOpts(arr.map((x) => ({ id: Number(x.id), label: String(x.fullName ?? x.name ?? x.roomName ?? x.id) })))
      })
      .catch(() => setOpts([]))
  }, [kind])

  const ok = !!sel && !!from && !!to && from <= to
  const key = kind === 'room' ? 'roomId' : 'trainerId'
  const base = ok ? qs({ [key]: sel, from, to } as Record<string, string>) : null
  const { data, loading, error } = useData<ScheduleReport>(base ? `/reports/operational/${kind}-schedule?${base}` : null)
  const exp = base ? `/reports/operational/export?kind=${kind === 'room' ? 'RoomSchedule' : 'TrainerSchedule'}&${base}` : null

  return (
    <Box title={kind === 'room' ? L.roomSch : L.trSch} actions={<ExportBtns path={exp} name={`${kind}-schedule`} />}>
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select className={field} value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">{kind === 'room' ? L.pickRoom : L.pickTrainer}</option>
          {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <input type="date" className={field} title={L.from} value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className={field} title={L.to} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <State loading={loading} error={error} empty={!!data && data.rows.length === 0} />
      {data && data.rows.length > 0 && (
        <Tbl heads={[L.date, L.time, L.course, L.section, kind === 'room' ? L.trainer : L.room, L.status]} min={680}>
          {data.rows.map((r) => (
            <tr key={r.sessionId}>
              <td className={td}><span className="tnum">{r.date.slice(0, 10)}</span></td>
              <td className={td}><span className="tnum" dir="ltr">{hm(r.startTime)} - {hm(r.endTime)}</span></td>
              <td className={td}>{r.courseName}</td>
              <td className={td}><b>{r.sectionName}</b></td>
              <td className={td}>{kind === 'room' ? r.trainerName : r.roomName}</td>
              <td className={td}><Pill tone={r.status === 'Held' ? 'green' : 'teal'}>{SES_ST[r.status] ?? r.status}</Pill></td>
            </tr>
          ))}
        </Tbl>
      )}
    </Box>
  )
}

function Operational() {
  const [status, setStatus] = useState('')
  const q = status ? qs({ status }) : ''
  const occ = useData<OccupancyReport>(`/reports/operational/section-occupancy${q ? `?${q}` : ''}`)
  return (
    <div className="space-y-6">
      <Box
        title={L.occupancy}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{L.allActive}</option>
              <option value="Draft">{SEC_ST.Draft}</option>
              <option value="OpenForEnrollment">{SEC_ST.OpenForEnrollment}</option>
              <option value="InProgress">{SEC_ST.InProgress}</option>
            </select>
            <ExportBtns path={`/reports/operational/export?kind=SectionOccupancy${q ? `&${q}` : ''}`} name="section-occupancy" />
          </div>
        }
      >
        <State loading={occ.loading} error={occ.error} empty={!!occ.data && occ.data.rows.length === 0} />
        {occ.data && occ.data.rows.length > 0 && (
          <Tbl heads={[L.section, L.trainer, L.room, L.status, L.capacity, L.taken, L.vacant, L.waiting]} min={820}>
            {occ.data.rows.map((r) => (
              <tr key={r.sectionId}>
                <td className={td}><b>{r.sectionName}</b><div className="text-[11px] text-muted-foreground">{r.courseName}</div></td>
                <td className={td}>{r.trainerName}</td>
                <td className={td}>{r.roomName}</td>
                <td className={td}><Pill tone="gray">{SEC_ST[r.status] ?? r.status}</Pill></td>
                <td className={td}><span className="tnum">{r.capacity}</span></td>
                <td className={td}><span className="tnum">{r.seatsTaken}</span></td>
                <td className={td}>{r.vacantSeats === 0 ? <Pill tone="red">0</Pill> : <b className="tnum text-[hsl(var(--success))]">{r.vacantSeats}</b>}</td>
                <td className={td}><span className="tnum">{r.waitingCount}</span></td>
              </tr>
            ))}
            <tr>
              <td className={td} colSpan={4}><b>{L.total}</b></td>
              <td className={td}><b className="tnum">{occ.data.totalCapacity}</b></td>
              <td className={td}><b className="tnum">{occ.data.totalSeatsTaken}</b></td>
              <td className={td}><b className="tnum">{occ.data.totalVacantSeats}</b></td>
              <td className={td}><b className="tnum">{occ.data.totalWaiting}</b></td>
            </tr>
          </Tbl>
        )}
      </Box>
      <ScheduleBox kind="room" />
      <ScheduleBox kind="trainer" />
    </div>
  )
}

export default function Reports() {
  const [tab, setTab] = useState('fin')
  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="fin" className="min-h-[44px]">{L.fin}</TabsTrigger>
          <TabsTrigger value="ops" className="min-h-[44px]">{L.ops}</TabsTrigger>
        </TabsList>
        <TabsContent value="fin"><Financial /></TabsContent>
        <TabsContent value="ops"><Operational /></TabsContent>
      </Tabs>
    </div>
  )
}