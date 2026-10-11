import { useEffect, useState } from 'react'
import { DatabaseBackup, Loader2, Pencil, Plus, Save, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/services/api'
import {
  backupsApi, settingsApi, templatesApi,
  type BackupInfo, type SettingDto, type TemplateDto,
} from '@/services/settings'

const L = {
  title: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a',
  subtitle: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a \u0648\u0627\u0644\u0646\u0633\u062e \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a',
  tabGeneral: '\u0639\u0627\u0645',
  tabTpl: '\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a',
  tabBackup: '\u0627\u0644\u0646\u0633\u062e \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a',
  save: '\u062d\u0641\u0638',
  saved: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638',
  back: '\u0631\u062c\u0648\u0639',
  confirm: '\u062a\u0623\u0643\u064a\u062f',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a',
  updated: '\u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b',
  passingScore: '\u062f\u0631\u062c\u0629 \u0627\u0644\u0646\u062c\u0627\u062d (\u0631\u0642\u0645 \u0635\u062d\u064a\u062d \u0645\u0646 1 \u0625\u0644\u0649 100)',
  addTpl: '\u0625\u0636\u0627\u0641\u0629 \u0642\u0627\u0644\u0628',
  editTpl: '\u062a\u0639\u062f\u064a\u0644 \u0642\u0627\u0644\u0628',
  center: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632',
  logo: '\u0645\u0633\u0627\u0631 \u0627\u0644\u0634\u0639\u0627\u0631 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)',
  signer: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0642\u0651\u0639',
  signerTitle: '\u0635\u0641\u0629 \u0627\u0644\u0645\u0648\u0642\u0651\u0639',
  body: '\u0646\u0635 \u0627\u0644\u0634\u0647\u0627\u062f\u0629',
  bodyHint: '\u064a\u0645\u0643\u0646 \u0627\u0633\u062a\u062e\u062f\u0627\u0645: {StudentName} {CourseName} {SectionName} {CertificateNumber} {IssueDate} {CenterName}',
  lang: '\u0627\u0644\u0644\u063a\u0629',
  ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
  en: 'English',
  isDefault: '\u0627\u0644\u0642\u0627\u0644\u0628 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a',
  def: '\u0627\u0641\u062a\u0631\u0627\u0636\u064a',
  makeDefault: '\u062a\u0639\u064a\u064a\u0646 \u0643\u0627\u0641\u062a\u0631\u0627\u0636\u064a',
  delTpl: '\u062d\u0630\u0641 \u0642\u0627\u0644\u0628',
  delConfirm: '\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0642\u0627\u0644\u0628\u061f',
  deleted: '\u062a\u0645 \u0627\u0644\u062d\u0630\u0641',
  langLocked: '\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0644\u063a\u0629 \u0628\u0639\u062f \u0627\u0644\u0625\u0646\u0634\u0627\u0621.',
  backupNow: '\u0623\u062e\u0630 \u0646\u0633\u062e\u0629 \u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629 \u0627\u0644\u0622\u0646',
  backupNote: '\u0642\u062f \u062a\u0633\u062a\u063a\u0631\u0642 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0648\u0642\u062a\u0627\u064b \u0645\u0639 \u0627\u0644\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0643\u0628\u064a\u0631\u0629.',
  backupDone: '\u062a\u0645\u062a \u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629',
  finished: '\u0648\u0642\u062a \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621',
  size: '\u0627\u0644\u062d\u062c\u0645',
  path: '\u0627\u0644\u0645\u0633\u0627\u0631 \u0639\u0644\u0649 \u062e\u0627\u062f\u0645 \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a',
  backupEmpty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u0633\u062e \u0645\u0633\u062c\u0644\u0629 (\u0642\u062f \u0644\u0627 \u064a\u0645\u0644\u0643 \u062d\u0633\u0627\u0628 \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0635\u0644\u0627\u062d\u064a\u0629 \u0642\u0631\u0627\u0621\u0629 \u0633\u062c\u0644 \u0627\u0644\u0646\u0633\u062e).',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
}

const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const fmtDt = (s: string | null) => (s ? new Date(s).toLocaleString('en-GB') : '-')
const fmtSize = (b: number) => (b <= 0 ? '-' : `${(b / 1048576).toFixed(1)} MB`)

export default function SettingsPage() {
  const [tab, setTab] = useState('general')
  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="min-h-[44px]">{L.tabGeneral}</TabsTrigger>
          <TabsTrigger value="tpl" className="min-h-[44px]">{L.tabTpl}</TabsTrigger>
          <TabsTrigger value="backup" className="min-h-[44px]">{L.tabBackup}</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><General /></TabsContent>
        <TabsContent value="tpl"><Templates /></TabsContent>
        <TabsContent value="backup"><Backups /></TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------

function General() {
  const [items, setItems] = useState<SettingDto[]>([])
  const [vals, setVals] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState('')

  const load = () => {
    setLoading(true)
    settingsApi
      .list()
      .then((r) => { setItems(r); setVals(Object.fromEntries(r.map((s) => [s.key, s.value]))); setError('') })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const save = async (key: string) => {
    setBusyKey(key)
    try {
      const r = await settingsApi.update(key, vals[key])
      setItems((xs) => xs.map((x) => (x.key === key ? r : x)))
      setVals((v) => ({ ...v, [key]: r.value }))
      toast.success(L.saved)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusyKey('')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  if (error) return <div className="py-8 text-center text-sm text-destructive">{error}</div>
  if (items.length === 0) return <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((s) => (
        <div key={s.key} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-1 text-sm font-extrabold">{s.key === 'PassingScore' ? L.passingScore : s.key}</div>
          {s.description && <div className="mb-2 text-xs text-muted-foreground">{s.description}</div>}
          <div className="flex gap-2">
            <input className={field} dir="ltr" value={vals[s.key] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [s.key]: e.target.value }))} />
            <Button disabled={busyKey === s.key || vals[s.key] === s.value} onClick={() => save(s.key)}>
              {busyKey === s.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">{L.updated}: <span className="tnum">{fmtDt(s.updatedAt)}</span></div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------

function Templates() {
  const [items, setItems] = useState<TemplateDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [key, setKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [dlg, setDlg] = useState<TemplateDto | 'new' | null>(null)
  const [center, setCenter] = useState('')
  const [logo, setLogo] = useState('')
  const [signer, setSigner] = useState('')
  const [sTitle, setSTitle] = useState('')
  const [body, setBody] = useState('')
  const [lang, setLang] = useState('ar')
  const [isDef, setIsDef] = useState(false)
  const [delFor, setDelFor] = useState<TemplateDto | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    templatesApi
      .list()
      .then((r) => { if (alive) { setItems(r); setError('') } })
      .catch((e) => { if (alive) setError(errMsg(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [key])

  const act = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
    setBusy(true)
    try { await fn(); toast.success(ok); after?.(); setKey((k) => k + 1) } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }

  const open = (t: TemplateDto | 'new') => {
    setDlg(t)
    if (t === 'new') { setCenter(''); setLogo(''); setSigner(''); setSTitle(''); setBody(''); setLang('ar'); setIsDef(false) }
    else { setCenter(t.centerName); setLogo(t.logoPath ?? ''); setSigner(t.signerName); setSTitle(t.signerTitle); setBody(t.bodyText); setLang(t.language); setIsDef(t.isDefault) }
  }
  const valid = center.trim() && signer.trim() && sTitle.trim() && body.trim()
  const save = () => {
    const b = { centerName: center.trim(), logoPath: logo.trim() || null, signerName: signer.trim(), signerTitle: sTitle.trim(), bodyText: body, isDefault: isDef }
    return act(
      () => (dlg === 'new' || dlg === null ? templatesApi.create({ ...b, language: lang }) : templatesApi.update(dlg.id, b)),
      L.saved, () => setDlg(null),
    )
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button className="min-h-[40px]" onClick={() => open('new')}><Plus className="me-2 h-4 w-4" />{L.addTpl}</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-destructive">{error}</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold">{t.centerName}</div>
                  <div className="text-xs text-muted-foreground">{t.signerName} - {t.signerTitle}</div>
                </div>
                <div className="flex gap-1">
                  <Pill tone="blue">{t.language === 'ar' ? L.ar : L.en}</Pill>
                  {t.isDefault && <Pill tone="green">{L.def}</Pill>}
                </div>
              </div>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{t.bodyText}</p>
              <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                {!t.isDefault && (
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => act(() => templatesApi.setDefault(t.id), L.saved)}>
                    <Star className="me-1 h-3.5 w-3.5" />{L.makeDefault}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => open(t)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setDelFor(t)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dlg !== null} onOpenChange={(o) => { if (!o) setDlg(null) }}>
        <DialogContent className="scrollbar-thin max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>{dlg === 'new' ? L.addTpl : L.editTpl}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <input className={field} placeholder={L.center} value={center} onChange={(e) => setCenter(e.target.value)} />
            <input className={field} dir="ltr" placeholder={L.logo} value={logo} onChange={(e) => setLogo(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className={field} placeholder={L.signer} value={signer} onChange={(e) => setSigner(e.target.value)} />
              <input className={field} placeholder={L.signerTitle} value={sTitle} onChange={(e) => setSTitle(e.target.value)} />
            </div>
            <textarea className="min-h-[110px] w-full rounded-md border bg-background p-3 text-sm" placeholder={L.body} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="text-[11px] text-muted-foreground" dir="ltr">{L.bodyHint}</div>
            <select className={field} value={lang} disabled={dlg !== 'new'} onChange={(e) => setLang(e.target.value)}>
              <option value="ar">{L.ar}</option>
              <option value="en">{L.en}</option>
            </select>
            {dlg !== 'new' && <div className="text-[11px] text-muted-foreground">{L.langLocked}</div>}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={isDef} onChange={(e) => setIsDef(e.target.checked)} />{L.isDefault}
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDlg(null)}>{L.back}</Button>
            <Button disabled={busy || !valid} onClick={save}>{busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!delFor} onOpenChange={(o) => { if (!o) setDelFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.delTpl}</DialogTitle></DialogHeader>
          <div className="text-sm">{L.delConfirm} <b>{delFor?.centerName}</b></div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDelFor(null)}>{L.back}</Button>
            <Button variant="destructive" disabled={busy} onClick={() => delFor && act(() => templatesApi.remove(delFor.id), L.deleted, () => setDelFor(null))}>{L.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Backups() {
  const [items, setItems] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [key, setKey] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    backupsApi
      .list(20)
      .then((r) => { if (alive) { setItems(r); setError('') } })
      .catch((e) => { if (alive) setError(errMsg(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [key])

  const run = async () => {
    setBusy(true)
    try {
      await backupsApi.create()
      toast.success(L.backupDone)
      setKey((k) => k + 1)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">{L.backupNote}</div>
        <Button className="min-h-[40px]" disabled={busy} onClick={run}>
          {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <DatabaseBackup className="me-2 h-4 w-4" />}{L.backupNow}
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-destructive">{error}</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{L.backupEmpty}</div>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[620px] border-collapse">
            <thead><tr><th className={th}>{L.finished}</th><th className={th}>{L.size}</th><th className={th}>{L.path}</th></tr></thead>
            <tbody>
              {items.map((b, i) => (
                <tr key={`${b.filePath}-${i}`}>
                  <td className={td}><span className="tnum whitespace-nowrap" dir="ltr">{fmtDt(b.finishedAtUtc)}</span></td>
                  <td className={td}><span className="tnum">{fmtSize(b.sizeBytes)}</span></td>
                  <td className={td}><span className="break-all text-xs text-muted-foreground" dir="ltr">{b.filePath}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}