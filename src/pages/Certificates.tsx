import { useEffect, useMemo, useState } from 'react'
import { Award, BadgeCheck, FileText, Loader2, Save, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCan } from '@/store/AppStore'
import { api, ApiError } from '@/services/api'
import type { EnrollmentDto } from '@/services/enrollments'
import {
  certificatesApi, gradesApi, openPdf,
  type CertificateDto, type EligibilityDto, type GradeDto,
} from '@/services/certificates'

const L = {
  title: '\u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062a \u0648\u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a',
  subtitle: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062a \u0627\u0644\u0646\u0647\u0627\u0626\u064a\u0629 \u0648\u0625\u0635\u062f\u0627\u0631 \u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a',
  tabGrades: '\u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062a',
  tabIssued: '\u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a \u0627\u0644\u0635\u0627\u062f\u0631\u0629',
  pickSection: '\u0627\u062e\u062a\u0631 \u0634\u0639\u0628\u0629',
  allSections: '\u0643\u0644 \u0627\u0644\u0634\u0639\u0628',
  student: '\u0627\u0644\u0637\u0627\u0644\u0628',
  score: '\u0627\u0644\u0639\u0644\u0627\u0645\u0629 (\u0645\u0646 100)',
  result: '\u0627\u0644\u0646\u062a\u064a\u062c\u0629',
  cert: '\u0627\u0644\u0634\u0647\u0627\u062f\u0629',
  passed: '\u0646\u0627\u062c\u062d',
  failed: '\u0631\u0627\u0633\u0628',
  noGrade: '\u0628\u062f\u0648\u0646 \u0639\u0644\u0627\u0645\u0629',
  eligible: '\u0645\u0624\u0647\u0644',
  notEligible: '\u063a\u064a\u0631 \u0645\u0624\u0647\u0644',
  issuedPill: '\u0635\u062f\u0631\u062a',
  saveGrades: '\u062d\u0641\u0638 \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062a',
  gradesSaved: '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062a',
  nothing: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u063a\u064a\u064a\u0631\u0627\u062a \u0644\u0644\u062d\u0641\u0638',
  badScore: '\u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0628\u064a\u0646 0 \u0648 100',
  issue: '\u0625\u0635\u062f\u0627\u0631',
  override: '\u0625\u0635\u062f\u0627\u0631 \u0628\u0627\u0633\u062a\u062b\u0646\u0627\u0621',
  overrideTitle: '\u0625\u0635\u062f\u0627\u0631 \u0634\u0647\u0627\u062f\u0629 \u0628\u0627\u0633\u062a\u062b\u0646\u0627\u0621 (\u0627\u0644\u0645\u062f\u064a\u0631)',
  overrideNote: '\u0633\u062a\u064f\u0635\u062f\u0631 \u0627\u0644\u0634\u0647\u0627\u062f\u0629 \u0631\u063a\u0645 \u0639\u062f\u0645 \u062a\u062d\u0642\u0642 \u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u062a\u0627\u0644\u064a\u0629:',
  reason: '\u0633\u0628\u0628 \u0627\u0644\u0627\u0633\u062a\u062b\u0646\u0627\u0621 (\u0645\u0637\u0644\u0648\u0628)',
  back: '\u0631\u062c\u0648\u0639',
  confirm: '\u062a\u0623\u0643\u064a\u062f',
  okIssue: '\u062a\u0645 \u0625\u0635\u062f\u0627\u0631 \u0627\u0644\u0634\u0647\u0627\u062f\u0629',
  number: '\u0631\u0642\u0645 \u0627\u0644\u0634\u0647\u0627\u062f\u0629',
  section: '\u0627\u0644\u0634\u0639\u0628\u0629',
  date: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
  exception: '\u0627\u0633\u062a\u062b\u0646\u0627\u0621',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a',
  prev: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  page: '\u0635\u0641\u062d\u0629',
  pdfFail: '\u062a\u0639\u0630\u0631 \u0641\u062a\u062d \u0627\u0644\u0634\u0647\u0627\u062f\u0629',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
}

interface SectionLite { id: number; name: string; status: string }
interface Row { enr: EnrollmentDto; grade: GradeDto | null; elig: EligibilityDto | null }

const PAGE_SIZE = 20
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const pagesOf = (t: number) => Math.max(1, Math.ceil(t / PAGE_SIZE))

export default function Certificates() {
  const canOverride = useCan('Certificates.Override')
  const [tab, setTab] = useState('grades')
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)
  const [sections, setSections] = useState<SectionLite[]>([])

  // grades tab
  const [sectionId, setSectionId] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [rowsLoading, setRowsLoading] = useState(false)
  const [scores, setScores] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)
  const [ovFor, setOvFor] = useState<Row | null>(null)
  const [reason, setReason] = useState('')

  // issued tab
  const [issued, setIssued] = useState<CertificateDto[]>([])
  const [iTotal, setITotal] = useState(0)
  const [iPage, setIPage] = useState(1)
  const [iSection, setISection] = useState('')
  const [iLoading, setILoading] = useState(true)

  useEffect(() => {
    ;(api.get('/sections?pageSize=100') as Promise<{ items: SectionLite[] }>)
      .then((r) => setSections(r.items.filter((s) => s.status !== 'Cancelled')))
      .catch(() => { /* ignore */ })
  }, [])

  useEffect(() => {
    if (!sectionId) { setRows([]); return }
    let alive = true
    setRowsLoading(true)
    ;(async () => {
      try {
        const [enr, grades] = await Promise.all([
          api.get(`/enrollments?sectionId=${sectionId}&pageSize=100`) as Promise<{ items: EnrollmentDto[] }>,
          gradesApi.bySection(Number(sectionId)),
        ])
        const list = enr.items.filter((e) => e.status === 'Confirmed' || e.status === 'Completed')
        const gMap = new Map(grades.map((g) => [g.enrollmentId, g]))
        const elig = await Promise.all(list.map((e) => certificatesApi.eligibility(e.id).catch(() => null)))
        if (!alive) return
        const built: Row[] = list.map((e, i) => ({ enr: e, grade: gMap.get(e.id) ?? null, elig: elig[i] }))
        setRows(built)
        const init: Record<number, string> = {}
        built.forEach((r) => { if (r.grade) init[r.enr.id] = String(r.grade.score) })
        setScores(init)
      } catch (e) {
        if (alive) toast.error(errMsg(e))
      } finally {
        if (alive) setRowsLoading(false)
      }
    })()
    return () => { alive = false }
  }, [sectionId, reloadKey])

  useEffect(() => {
    let alive = true
    setILoading(true)
    certificatesApi
      .list({ sectionId: iSection ? Number(iSection) : undefined, page: iPage, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) { setIssued(r.items); setITotal(r.totalCount ?? r.total ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setILoading(false) })
    return () => { alive = false }
  }, [iSection, iPage, reloadKey])

  const changed = useMemo(
    () => rows.filter((r) => {
      const v = scores[r.enr.id]
      return v !== undefined && v !== '' && (!r.grade || Number(v) !== r.grade.score)
    }),
    [rows, scores],
  )

  const saveGrades = async () => {
    if (changed.length === 0) { toast.info(L.nothing); return }
    for (const r of changed) {
      const n = Number(scores[r.enr.id])
      if (!(n >= 0 && n <= 100)) { toast.error(`${r.enr.studentName}: ${L.badScore}`); return }
    }
    setBusy(true)
    let ok = 0
    for (const r of changed) {
      try {
        await gradesApi.record(r.enr.id, Number(scores[r.enr.id]))
        ok++
      } catch (e) {
        toast.error(`${r.enr.studentName}: ${errMsg(e)}`)
      }
    }
    setBusy(false)
    if (ok > 0) { toast.success(L.gradesSaved); reload() }
  }

  const issue = async (r: Row) => {
    setBusy(true)
    try {
      await certificatesApi.issue(r.enr.id)
      toast.success(L.okIssue)
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const issueOverride = async () => {
    if (!ovFor) return
    setBusy(true)
    try {
      await certificatesApi.issueOverride(ovFor.enr.id, reason.trim())
      toast.success(L.okIssue)
      setOvFor(null)
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const pdf = (id: number, lang: 'ar' | 'en') => { openPdf(`/certificates/${id}/pdf?language=${lang}`).catch(() => toast.error(L.pdfFail)) }

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="grades" className="min-h-[44px] gap-2"><BadgeCheck className="h-4 w-4" />{L.tabGrades}</TabsTrigger>
          <TabsTrigger value="issued" className="min-h-[44px] gap-2"><Award className="h-4 w-4" />{L.tabIssued}</TabsTrigger>
        </TabsList>

        {/* ---------------- grades ---------------- */}
        <TabsContent value="grades">
          <select className={`${field} mb-4 max-w-md`} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">{L.pickSection}</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {rowsLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {!rowsLoading && sectionId && rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">{L.empty}</div>}

          {!rowsLoading && rows.length > 0 && (
            <>
              <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
                <table className="w-full min-w-[820px] border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>{L.student}</th><th className={th}>{L.score}</th><th className={th}>{L.result}</th>
                      <th className={th}>{L.cert}</th><th className={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.enr.id}>
                        <td className={td}><b>{r.enr.studentName}</b></td>
                        <td className={td}>
                          <input type="number" min={0} max={100} dir="ltr" className="h-10 w-24 rounded-md border bg-background px-2 text-sm"
                            value={scores[r.enr.id] ?? ''} disabled={r.elig?.alreadyIssued}
                            onChange={(e) => setScores({ ...scores, [r.enr.id]: e.target.value })} />
                        </td>
                        <td className={td}>
                          {r.grade ? <Pill tone={r.grade.isPassed ? 'green' : 'red'}>{r.grade.isPassed ? L.passed : L.failed}</Pill>
                            : <span className="text-xs text-muted-foreground">{L.noGrade}</span>}
                        </td>
                        <td className={td}>
                          {r.elig?.alreadyIssued ? <Pill tone="purple">{L.issuedPill}</Pill>
                            : r.elig?.isEligible ? <Pill tone="green">{L.eligible}</Pill>
                            : <div>
                                <Pill tone="red">{L.notEligible}</Pill>
                                {r.elig?.blockers.map((b, i) => <div key={i} className="mt-1 text-[11px] text-muted-foreground" dir="ltr">{b}</div>)}
                              </div>}
                        </td>
                        <td className={td}>
                          {r.elig && !r.elig.alreadyIssued && (
                            <div className="flex flex-wrap gap-1">
                              {r.elig.isEligible && (
                                <Button size="sm" disabled={busy} onClick={() => issue(r)}>
                                  <Award className="me-1 h-3.5 w-3.5" />{L.issue}
                                </Button>
                              )}
                              {!r.elig.isEligible && canOverride && (
                                <Button size="sm" variant="outline" className="border-amber-400 text-amber-700" onClick={() => { setOvFor(r); setReason('') }}>
                                  <ShieldAlert className="me-1 h-3.5 w-3.5" />{L.override}
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button className="mt-4 min-h-[44px]" disabled={busy} onClick={saveGrades}>
                {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}{L.saveGrades}
              </Button>
            </>
          )}
        </TabsContent>

        {/* ---------------- issued ---------------- */}
        <TabsContent value="issued">
          <select className={`${field} mb-4 max-w-md`} value={iSection} onChange={(e) => { setISection(e.target.value); setIPage(1) }}>
            <option value="">{L.allSections}</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {iLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : issued.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{L.empty}</div>
          ) : (
            <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{L.number}</th><th className={th}>{L.student}</th><th className={th}>{L.section}</th>
                    <th className={th}>{L.date}</th><th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {issued.map((c) => (
                    <tr key={c.id}>
                      <td className={td}>
                        <span className="tnum font-bold" dir="ltr">{c.certificateNumber}</span>
                        {c.isOverride && <Pill tone="amber" className="ms-2">{L.exception}</Pill>}
                        {c.overrideReason && <div className="mt-1 text-[11px] text-muted-foreground">{c.overrideReason}</div>}
                      </td>
                      <td className={td}><b>{c.studentName}</b></td>
                      <td className={td}>{c.sectionName}<div className="text-xs text-muted-foreground">{c.courseName}</div></td>
                      <td className={td}><span className="tnum">{c.issuedAt.slice(0, 10)}</span></td>
                      <td className={td}>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => pdf(c.id, 'ar')}><FileText className="me-1 h-3.5 w-3.5" />PDF AR</Button>
                          <Button size="sm" variant="outline" onClick={() => pdf(c.id, 'en')}>PDF EN</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-3 text-sm">
            <Button variant="outline" size="sm" disabled={iPage <= 1} onClick={() => setIPage(iPage - 1)}>{L.prev}</Button>
            <span className="tnum">{L.page} {iPage} / {pagesOf(iTotal)}</span>
            <Button variant="outline" size="sm" disabled={iPage >= pagesOf(iTotal)} onClick={() => setIPage(iPage + 1)}>{L.next}</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* override dialog */}
      <Dialog open={!!ovFor} onOpenChange={(o) => { if (!o) setOvFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.overrideTitle}</DialogTitle></DialogHeader>
          {ovFor && (
            <div className="space-y-1 text-sm">
              <div><b>{ovFor.enr.studentName}</b></div>
              <div className="text-xs text-muted-foreground">{L.overrideNote}</div>
              {ovFor.elig?.blockers.map((b, i) => <div key={i} className="text-xs text-destructive" dir="ltr">- {b}</div>)}
            </div>
          )}
          <input className={field} placeholder={L.reason} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOvFor(null)}>{L.back}</Button>
            <Button disabled={busy || !reason.trim()} onClick={issueOverride}>{L.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}