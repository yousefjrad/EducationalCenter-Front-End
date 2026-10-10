import { useMemo, useState } from 'react'
import { Award, Printer, Save, ShieldAlert, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useStore, useCan, activeEnrollmentsOf, enrollmentPaid } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import type { Certificate, Section } from '@/types'
import { fmtDate } from '@/lib/format'
import { PageHeader, EmptyState, Pill, Field, TableScroll, Th, Td } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Certificates() {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const canOverride = useCan('Certificates.Override')
  const [sectionId, setSectionId] = useState('')
  const [scores, setScores] = useState<Record<number, string>>({})
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null)

  const sections = state.sections.filter((s) => s.status !== 'cancelled')
  const section = sections.find((s) => s.id === Number(sectionId))
  const students = section ? activeEnrollmentsOf(state, section.id) : []

  const pickSection = (v: string) => {
    setSectionId(v)
    const sec = sections.find((s) => s.id === Number(v))
    const init: Record<number, string> = {}
    if (sec) {
      state.grades.filter((g) => g.sectionId === sec.id).forEach((g) => { init[g.studentId] = String(g.score) })
    }
    setScores(init)
  }

  const saveGrades = () => {
    if (!section) return
    const grades = students
      .filter((e) => scores[e.studentId] !== undefined && scores[e.studentId] !== '')
      .map((e) => ({ studentId: e.studentId, score: Math.min(100, Math.max(0, Number(scores[e.studentId]) || 0)) }))
    dispatch({ type: 'SAVE_GRADES', sectionId: section.id, grades })
    toast.success(t('cert.gradesSaved'))
  }

  const eligibility = (studentId: number, sec: Section) => {
    const enroll = state.enrollments.find((e) => e.studentId === studentId && e.sectionId === sec.id && e.status === 'active')
    const grade = state.grades.find((g) => g.studentId === studentId && g.sectionId === sec.id)
    const paidFull = enroll ? enrollmentPaid(state, enroll.id) >= sec.price : false
    const passed = grade ? grade.score >= state.settings.passMark : false
    return { paidFull, passed, ok: paidFull && passed }
  }

  const issue = (studentId: number, override: boolean) => {
    if (!section) return
    dispatch({ type: 'ISSUE_CERT', studentId, sectionId: section.id, override })
    toast.success(t(override ? 'cert.overrideDone' : 'cert.issueDone'))
  }

  const issued = useMemo(
    () => [...state.certificates].sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    [state.certificates],
  )

  return (
    <div>
      <PageHeader title={t('cert.title')} subtitle={t('cert.subtitle')} />

      <Tabs defaultValue="grades">
        <TabsList className="mb-4">
          <TabsTrigger value="grades" className="min-h-[44px]">{t('cert.tab.grades')}</TabsTrigger>
          <TabsTrigger value="issued" className="min-h-[44px]">{t('cert.tab.issued')} ({issued.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          <Field label={t('cert.pickSection')}>
            <Select value={sectionId} onValueChange={pickSection}>
              <SelectTrigger className="min-h-[44px] max-w-md"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          {section && students.length > 0 && (
            <div className="mt-5">
              <TableScroll>
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr>
                      <Th>{t('common.student')}</Th>
                      <Th>{t('cert.score')}</Th>
                      <Th>{t('cert.condPaid')}</Th>
                      <Th>{t('cert.condGrade')}</Th>
                      <Th>{t('common.status')}</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((e) => {
                      const st = state.students.find((x) => x.id === e.studentId)!
                      const elig = eligibility(e.studentId, section)
                      const cert = state.certificates.find((c) => c.studentId === e.studentId && c.sectionId === section.id)
                      return (
                        <tr key={e.id} className="border-b last:border-0">
                          <Td className="font-bold">{st.name}</Td>
                          <Td>
                            <Input
                              type="number" dir="ltr" min={0} max={100}
                              className="h-10 w-24"
                              value={scores[e.studentId] ?? ''}
                              onChange={(ev) => setScores({ ...scores, [e.studentId]: ev.target.value })}
                            />
                          </Td>
                          <Td>{elig.paidFull ? <BadgeCheck className="h-5 w-5 text-emerald-600" /> : <span className="text-destructive">✗</span>}</Td>
                          <Td>{elig.passed ? <BadgeCheck className="h-5 w-5 text-emerald-600" /> : <span className="text-destructive">✗</span>}</Td>
                          <Td>
                            {cert
                              ? <Pill tone="purple">{t('cert.issued')}</Pill>
                              : elig.ok
                                ? <Pill tone="green">{t('cert.eligible')}</Pill>
                                : <Pill tone="red">{t('cert.notEligible')}</Pill>}
                          </Td>
                          <Td>
                            {!cert && (elig.ok || canOverride) && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm" className="min-h-[36px]" disabled={!elig.ok}
                                  onClick={() => issue(e.studentId, false)}
                                >
                                  <Award className="me-1 h-3.5 w-3.5" />{t('cert.issue')}
                                </Button>
                                {!elig.ok && canOverride && (
                                  <Button size="sm" variant="outline" className="min-h-[36px] border-amber-400 text-amber-700" onClick={() => issue(e.studentId, true)}>
                                    <ShieldAlert className="me-1 h-3.5 w-3.5" />{t('cert.override')}
                                  </Button>
                                )}
                              </div>
                            )}
                            {cert && (
                              <Button size="sm" variant="ghost" className="min-h-[36px]" onClick={() => setPreviewCert(cert)}>
                                <Printer className="me-1 h-3.5 w-3.5" />{t('cert.preview')}
                              </Button>
                            )}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </TableScroll>
              <Button className="mt-4 min-h-[44px]" onClick={saveGrades}>
                <Save className="me-2 h-4 w-4" />{t('cert.saveGrades')}
              </Button>
            </div>
          )}
          {section && students.length === 0 && <div className="mt-5"><EmptyState message={t('att.empty')} /></div>}
        </TabsContent>

        <TabsContent value="issued">
          {issued.length === 0 ? (
            <EmptyState message={t('cert.emptyIssued')} icon={<Award className="h-10 w-10" strokeWidth={1.2} />} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr>
                    <Th>{t('cert.serial')}</Th>
                    <Th>{t('common.student')}</Th>
                    <Th>{t('common.section')}</Th>
                    <Th>{t('cert.issueDate')}</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {issued.map((c) => {
                    const st = state.students.find((x) => x.id === c.studentId)
                    const sec = state.sections.find((x) => x.id === c.sectionId)
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                        <Td><span className="tnum font-bold" dir="ltr">{c.serial}</span>{c.override && <Pill tone="amber" className="ms-2">{t('cert.override')}</Pill>}</Td>
                        <Td className="font-bold">{st?.name}</Td>
                        <Td className="text-muted-foreground">{sec?.title}</Td>
                        <Td><span className="tnum">{fmtDate(c.issueDate)}</span></Td>
                        <Td>
                          <Button size="sm" variant="outline" className="min-h-[36px]" onClick={() => setPreviewCert(c)}>
                            <Printer className="me-1 h-3.5 w-3.5" />{t('cert.preview')}
                          </Button>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableScroll>
          )}
        </TabsContent>
      </Tabs>

      {previewCert && <CertificatePreview cert={previewCert} onClose={() => setPreviewCert(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------

export function CertificatePreview({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const { t } = useI18n()
  const { state } = useStore()
  const st = state.students.find((x) => x.id === cert.studentId)
  const sec = state.sections.find((x) => x.id === cert.sectionId)
  const course = state.courses.find((c) => c.id === sec?.courseId)
  const grade = state.grades.find((g) => g.studentId === cert.studentId && g.sectionId === cert.sectionId)
  const tpl = state.certTemplate

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="printable bg-white p-2">
          <div className="rounded-lg border-[3px] border-double border-primary/70 p-8 sm:p-10" dir="rtl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-white">
                  {tpl.logoText}
                </div>
                <div>
                  <div className="text-xl font-black text-primary">{tpl.centerName}</div>
                  <div className="text-xs text-muted-foreground">{t('app.tagline')}</div>
                </div>
              </div>
              <div className="tnum text-xs text-muted-foreground" dir="ltr">{cert.serial}</div>
            </div>

            <div className="mt-10 text-center">
              <div className="text-sm font-bold tracking-widest text-muted-foreground">{t('cert.certifies')}</div>
              <div className="mt-3 text-4xl font-black text-foreground">{st?.name}</div>
              <p className="mx-auto mt-6 max-w-xl text-sm leading-loose text-muted-foreground">{tpl.bodyText}</p>
              <div className="mt-4 text-lg font-extrabold">
                {t('cert.completed')}: <span className="text-primary">{course?.name}</span>
              </div>
              {grade && (
                <div className="mt-2 text-base font-bold">
                  {t('cert.withGrade')} <span className="tnum text-primary">{grade.score}/{grade.maxScore}</span>
                </div>
              )}
            </div>

            <div className="mt-12 flex items-end justify-between text-sm">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">{t('cert.issueDate')}</div>
                <div className="tnum mt-1 font-extrabold">{fmtDate(cert.issueDate)}</div>
              </div>
              <div className="text-center">
                <div className="mb-1 font-extrabold">{tpl.signatureName}</div>
                <div className="text-xs text-muted-foreground">{t('cert.manager')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="no-print flex items-center justify-end gap-2 border-t bg-muted/40 p-4">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.close')}</Button>
          <Button className="min-h-[44px]" onClick={() => window.print()}>
            <Printer className="me-2 h-4 w-4" />{t('common.print')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
