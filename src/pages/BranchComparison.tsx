import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { ApiError } from '@/services/api'
import { crossBranchApi, type BranchComparisonReport } from '@/services/crossBranch'

const L = {
  title: '\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0641\u0631\u0648\u0639',
  subtitle: '\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0623\u062f\u0627\u0621 \u0644\u0643\u0644 \u0641\u0631\u0639 \u062e\u0644\u0627\u0644 \u0627\u0644\u0641\u062a\u0631\u0629 \u0627\u0644\u0645\u062d\u062f\u062f\u0629\u060c \u0645\u0639 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a.',
  from: '\u0645\u0646 \u062a\u0627\u0631\u064a\u062e',
  to: '\u0625\u0644\u0649 \u062a\u0627\u0631\u064a\u062e',
  branch: '\u0627\u0644\u0641\u0631\u0639',
  revenue: '\u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a',
  expenses: '\u0627\u0644\u0645\u0635\u0627\u0631\u064a\u0641',
  payroll: '\u0631\u0648\u0627\u062a\u0628 \u0627\u0644\u0645\u062f\u0631\u0628\u064a\u0646',
  profit: '\u0635\u0627\u0641\u064a \u0627\u0644\u0631\u0628\u062d',
  students: '\u0627\u0644\u0637\u0644\u0627\u0628',
  newEnr: '\u062a\u0633\u062c\u064a\u0644\u0627\u062a \u062c\u062f\u064a\u062f\u0629',
  attendance: '\u0646\u0633\u0628\u0629 \u0627\u0644\u062d\u0636\u0648\u0631',
  fill: '\u0627\u0645\u062a\u0644\u0627\u0621 \u0627\u0644\u0634\u0639\u0628',
  collection: '\u0646\u0633\u0628\u0629 \u0627\u0644\u062a\u062d\u0635\u064a\u0644',
  overdue: '\u0627\u0644\u0645\u062a\u0623\u062e\u0631\u0627\u062a',
  installments: '\u0642\u0633\u0637',
  total: '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a',
  closed: '\u0645\u0648\u0642\u0648\u0641',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0631\u0648\u0639',
  unit: '\u0627\u0644\u0645\u0628\u0627\u0644\u063a \u0628\u0627\u0644\u0644\u064a\u0631\u0629 \u0627\u0644\u0633\u0648\u0631\u064a\u0629',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
}

const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const pct = (n: number | null) => (n === null || n === undefined ? '-' : `${n.toFixed(1)}%`)
const pad = (n: number) => String(n).padStart(2, '0')
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default function BranchComparison() {
  const now = new Date()
  const [from, setFrom] = useState(isoDay(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [to, setTo] = useState(isoDay(now))
  const [data, setData] = useState<BranchComparisonReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!from || !to) return
    let alive = true
    setLoading(true)
    crossBranchApi.comparison(from, to)
      .then((r) => { if (alive) setData(r) })
      .catch((e) => { if (alive) { setData(null); toast.error(errMsg(e)) } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [from, to])

  const money = (n: number) => <span className="tnum" dir="ltr">{n0(n)}</span>
  const profit = (n: number) => (
    <span className={n < 0 ? 'tnum font-bold text-destructive' : 'tnum font-bold'} dir="ltr">{n0(n)}</span>
  )

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div><div className="mb-1 text-xs text-muted-foreground">{L.from}</div><input type="date" className={field} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><div className="mb-1 text-xs text-muted-foreground">{L.to}</div><input type="date" className={field} value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      <div className="mb-3 text-xs text-muted-foreground">{L.unit}</div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !data || data.branches.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[1150px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{L.branch}</th><th className={th}>{L.revenue}</th><th className={th}>{L.expenses}</th>
                <th className={th}>{L.payroll}</th><th className={th}>{L.profit}</th><th className={th}>{L.students}</th>
                <th className={th}>{L.newEnr}</th><th className={th}>{L.attendance}</th><th className={th}>{L.fill}</th>
                <th className={th}>{L.collection}</th><th className={th}>{L.overdue}</th>
              </tr>
            </thead>
            <tbody>
              {data.branches.map((b) => (
                <tr key={b.branchId}>
                  <td className={td}>
                    <b>{b.branchName}</b>
                    <div className="tnum text-xs text-muted-foreground" dir="ltr">{b.branchCode}</div>
                    {!b.isActive && <Pill tone="gray">{L.closed}</Pill>}
                  </td>
                  <td className={td}>{money(b.revenueSyp)}</td>
                  <td className={td}>{money(b.expensesSyp)}</td>
                  <td className={td}>{money(b.payrollSyp)}</td>
                  <td className={td}>{profit(b.netProfitSyp)}</td>
                  <td className={td}><span className="tnum">{b.studentCount}</span></td>
                  <td className={td}><span className="tnum">{b.newEnrollments}</span></td>
                  <td className={td}><span className="tnum" dir="ltr">{pct(b.attendanceRatePercent)}</span></td>
                  <td className={td}><span className="tnum" dir="ltr">{pct(b.sectionFillRatePercent)}</span></td>
                  <td className={td}><span className="tnum" dir="ltr">{pct(b.collectionRatePercent)}</span></td>
                  <td className={td}>
                    {money(b.overdueSyp)}
                    <div className="tnum text-[11px] text-muted-foreground">{b.overdueInstallments} {L.installments}</div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-bold">
                <td className={td}>{L.total}</td>
                <td className={td}>{money(data.totals.revenueSyp)}</td>
                <td className={td}>{money(data.totals.expensesSyp)}</td>
                <td className={td}>{money(data.totals.payrollSyp)}</td>
                <td className={td}>{profit(data.totals.netProfitSyp)}</td>
                <td className={td}><span className="tnum">{data.totals.studentCount}</span></td>
                <td className={td}><span className="tnum">{data.totals.newEnrollments}</span></td>
                <td className={td}></td><td className={td}></td><td className={td}></td>
                <td className={td}>
                  {money(data.totals.overdueSyp)}
                  <div className="tnum text-[11px] font-normal text-muted-foreground">{data.totals.overdueInstallments} {L.installments}</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}