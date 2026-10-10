import { useMemo } from 'react'
import { FileSpreadsheet, Printer, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { useStore, activeEnrollmentsOf, enrollmentRemaining, overdueInstallments, monthlyRevenue } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import { downloadCSV, fmtDate, monthKey, monthLabel, timeRange } from '@/lib/format'
import { PageHeader, Pill, TableScroll, Th, Td, Money, Card, CardContent, CardHeader, CardTitle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Reports() {
  const { t, lang } = useI18n()
  const { state } = useStore()

  const balances = useMemo(
    () =>
      state.enrollments
        .filter((e) => e.status === 'active')
        .map((e) => ({
          enrollment: e,
          student: state.students.find((s) => s.id === e.studentId)!,
          section: state.sections.find((s) => s.id === e.sectionId)!,
          remaining: enrollmentRemaining(state, e.id),
        }))
        .filter((x) => x.remaining > 0)
        .sort((a, b) => b.remaining - a.remaining),
    [state],
  )

  const overdue = useMemo(() => overdueInstallments(state), [state])

  const monthly = useMemo(() => {
    const out = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const ym = monthKey(d.toISOString().slice(0, 10))
      out.push({ ym, revenue: monthlyRevenue(state, ym) })
    }
    return out
  }, [state])

  const exportBtn = (fn: () => void) => (
    <Button variant="outline" size="sm" className="min-h-[36px]" onClick={() => { fn(); toast.success(t('reports.exported')) }}>
      <FileSpreadsheet className="me-1 h-3.5 w-3.5" />{t('common.exportExcel')}
    </Button>
  )

  return (
    <div>
      <PageHeader
        title={t('reports.title')} subtitle={t('reports.subtitle')}
        actions={
          <Button variant="outline" className="min-h-[44px]" onClick={() => window.print()}>
            <Printer className="me-2 h-4 w-4" />{t('common.print')}
          </Button>
        }
      />
      <p className="-mt-4 mb-5 text-xs text-muted-foreground">{t('reports.printHint')}</p>

      <Tabs defaultValue="financial">
        <TabsList className="mb-4">
          <TabsTrigger value="financial" className="min-h-[44px]">{t('reports.financial')}</TabsTrigger>
          <TabsTrigger value="operational" className="min-h-[44px]">{t('reports.operational')}</TabsTrigger>
        </TabsList>

        {/* ---------- financial ---------- */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-extrabold">{t('reports.monthlyRevenue')}</CardTitle>
              {exportBtn(() => downloadCSV('monthly-revenue.csv', [t('common.month'), t('profit.revenue')], monthly.map((m) => [monthLabel(m.ym, lang), m.revenue])))}
            </CardHeader>
            <CardContent>
              <TableScroll>
                <table className="w-full min-w-[420px] border-0 shadow-none">
                  <thead><tr><Th>{t('common.month')}</Th><Th>{t('profit.revenue')}</Th></tr></thead>
                  <tbody>
                    {monthly.map((m) => (
                      <tr key={m.ym} className="border-b last:border-0">
                        <Td className="font-bold">{monthLabel(m.ym, lang)}</Td>
                        <Td><Money amount={m.revenue} className="text-[hsl(var(--success))]" /></Td>
                      </tr>
                    ))}
                    <tr>
                      <Td className="font-extrabold">{t('common.total')}</Td>
                      <Td><Money amount={monthly.reduce((a, m) => a + m.revenue, 0)} className="text-primary" /></Td>
                    </tr>
                  </tbody>
                </table>
              </TableScroll>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-extrabold">{t('reports.remainingByStudent')} <Pill tone="amber" className="ms-2">{balances.length}</Pill></CardTitle>
              {exportBtn(() => downloadCSV('outstanding-balances.csv', [t('common.student'), t('common.section'), t('common.remaining')], balances.map((b) => [b.student.name, b.section.title, b.remaining])))}
            </CardHeader>
            <CardContent>
              {balances.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('reports.noBalances')}</p>
              ) : (
                <TableScroll>
                  <table className="w-full min-w-[560px] border-0 shadow-none">
                    <thead><tr><Th>{t('common.student')}</Th><Th>{t('common.section')}</Th><Th>{t('common.remaining')}</Th></tr></thead>
                    <tbody>
                      {balances.map((b) => (
                        <tr key={b.enrollment.id} className="border-b last:border-0">
                          <Td className="font-bold">{b.student.name}</Td>
                          <Td className="text-muted-foreground">{b.section.title}</Td>
                          <Td><Money amount={b.remaining} className="text-destructive" /></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-extrabold">{t('reports.overdueList')} <Pill tone="red" className="ms-2">{overdue.length}</Pill></CardTitle>
              {exportBtn(() => downloadCSV('overdue-installments.csv', [t('common.student'), t('common.section'), t('payments.installments'), t('common.amount'), t('payments.dueDate')], overdue.map((o) => [o.student.name, o.section.title, o.installment.label, o.installment.amount, fmtDate(o.installment.dueDate)])))}
            </CardHeader>
            <CardContent>
              {overdue.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('reports.noOverdue')}</p>
              ) : (
                <TableScroll>
                  <table className="w-full min-w-[640px] border-0 shadow-none">
                    <thead><tr><Th>{t('common.student')}</Th><Th>{t('common.section')}</Th><Th>{t('payments.installments')}</Th><Th>{t('common.amount')}</Th><Th>{t('payments.dueDate')}</Th></tr></thead>
                    <tbody>
                      {overdue.map((o) => (
                        <tr key={o.installment.id} className="border-b last:border-0">
                          <Td className="font-bold">{o.student.name}</Td>
                          <Td className="text-muted-foreground">{o.section.title}</Td>
                          <Td>{o.installment.label}</Td>
                          <Td><Money amount={o.installment.amount - o.paid} className="text-destructive" /></Td>
                          <Td><span className="tnum text-muted-foreground">{fmtDate(o.installment.dueDate)}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- operational ---------- */}
        <TabsContent value="operational" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-extrabold">{t('reports.studentsPerSection')}</CardTitle>
              {exportBtn(() =>
                downloadCSV(
                  'students-per-section.csv',
                  [t('common.section'), t('sections.enrolled'), t('sections.capacity'), t('sections.vacant')],
                  state.sections.filter((s) => s.status === 'open').map((s) => {
                    const n = activeEnrollmentsOf(state, s.id).length
                    return [s.title, n, s.capacity, Math.max(0, s.capacity - n)]
                  }),
                ),
              )}
            </CardHeader>
            <CardContent>
              <TableScroll>
                <table className="w-full min-w-[560px] border-0 shadow-none">
                  <thead><tr><Th>{t('common.section')}</Th><Th>{t('sections.enrolled')}</Th><Th>{t('sections.capacity')}</Th><Th>{t('sections.vacant')}</Th></tr></thead>
                  <tbody>
                    {state.sections.filter((s) => s.status === 'open').map((s) => {
                      const n = activeEnrollmentsOf(state, s.id).length
                      const vacant = Math.max(0, s.capacity - n)
                      return (
                        <tr key={s.id} className="border-b last:border-0">
                          <Td className="font-bold">{s.title}</Td>
                          <Td className="tnum">{n}</Td>
                          <Td className="tnum">{s.capacity}</Td>
                          <Td>{vacant === 0 ? <Pill tone="red">{t('sections.full')}</Pill> : <span className="tnum font-bold text-[hsl(var(--success))]">{vacant}</span>}</Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </TableScroll>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ScheduleTable
              title={t('reports.roomSchedule')}
              entities={state.rooms.filter((r) => r.active)}
              keyName="roomId"
            />
            <ScheduleTable
              title={t('reports.trainerSchedule')}
              entities={state.trainers.filter((x) => x.active)}
              keyName="trainerId"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <BarChart3 className="h-4 w-4" />
        {t('reports.subtitle')}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function ScheduleTable({ title, entities, keyName }: { title: string; entities: { id: number; name: string }[]; keyName: 'roomId' | 'trainerId' }) {
  const { t } = useI18n()
  const { state } = useStore()
  const open = state.sections.filter((s) => s.status === 'open')

  return (
    <Card className="shadow-sm">
      <CardHeader><CardTitle className="text-base font-extrabold">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {entities.map((ent) => {
          const slots = open
            .filter((s) => s[keyName] === ent.id)
            .flatMap((s) => s.schedule.map((sl) => ({ section: s, slot: sl })))
            .sort((a, b) => a.slot.day - b.slot.day || a.slot.start.localeCompare(b.slot.start))
          if (slots.length === 0) return null
          return (
            <div key={ent.id} className="rounded-xl border p-3">
              <div className="mb-2 font-extrabold">{ent.name}</div>
              <div className="space-y-1">
                {slots.map(({ section, slot }, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                    <Pill tone="teal">{t(`daysShort.${slot.day}`)}</Pill>
                    <span className="tnum text-muted-foreground" dir="ltr">{timeRange(slot.start, slot.end)}</span>
                    <span className="min-w-0 truncate font-bold">{section.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
