import { useState } from 'react'
import { Save, RotateCcw, DatabaseBackup, Award } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import { fmtDateTime, nowISODateTime } from '@/lib/format'
import { PageHeader, Field, Card, CardContent, CardHeader, CardTitle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n()
  const { state, dispatch } = useStore()
  const [s, setS] = useState({ ...state.settings })
  const [tpl, setTpl] = useState({ ...state.certTemplate })
  const [resetOpen, setResetOpen] = useState(false)
  const [lastBackup, setLastBackup] = useState<string>(() => localStorage.getItem('ecms-last-backup') ?? '—')

  const saveSettings = () => {
    dispatch({ type: 'SAVE_SETTINGS', settings: s })
    if (s.language !== lang) setLang(s.language)
    toast.success(t('settings.saved'))
  }

  const saveTemplate = () => {
    dispatch({ type: 'SAVE_TEMPLATE', template: tpl })
    toast.success(t('settings.saved'))
  }

  const backupNow = () => {
    const stamp = nowISODateTime()
    localStorage.setItem('ecms-last-backup', stamp)
    setLastBackup(stamp)
    // download a JSON snapshot as a tangible backup artifact
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `backup-${stamp.replaceAll(':', '-').replace(' ', '_')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(t('settings.backupDone'))
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="min-h-[44px]">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="template" className="min-h-[44px]">{t('settings.template')}</TabsTrigger>
        </TabsList>

        {/* ---------- general ---------- */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-extrabold">{t('settings.general')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label={t('settings.centerName')}>
                  <Input className="min-h-[44px]" value={s.centerName} onChange={(e) => setS({ ...s, centerName: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('settings.passMark')}>
                    <Input type="number" dir="ltr" min={0} max={100} className="min-h-[44px]" value={s.passMark} onChange={(e) => setS({ ...s, passMark: Number(e.target.value) })} />
                  </Field>
                  <Field label={t('settings.exchangeRate')}>
                    <Input type="number" dir="ltr" className="min-h-[44px]" value={s.defaultExchangeRate} onChange={(e) => setS({ ...s, defaultExchangeRate: Number(e.target.value) })} />
                  </Field>
                </div>
                <Field label={t('settings.language')}>
                  <Select value={s.language} onValueChange={(v) => setS({ ...s, language: v as 'ar' | 'en' })}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('settings.seatHold')}>
                  <div className="flex items-center gap-3">
                    <Input type="number" dir="ltr" className="min-h-[44px] w-32" value={s.seatHoldHours} onChange={(e) => setS({ ...s, seatHoldHours: Number(e.target.value) })} />
                    <span className="text-xs text-muted-foreground">{t('settings.future')}</span>
                  </div>
                </Field>
                <Button className="min-h-[44px]" onClick={saveSettings}>
                  <Save className="me-2 h-4 w-4" />{t('common.save')}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-extrabold">{t('settings.backup')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex min-h-[44px] items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-bold">{t('settings.backup')}</span>
                  <Switch checked={s.autoBackup} onCheckedChange={(v) => setS({ ...s, autoBackup: v })} />
                </div>
                <Field label={t('settings.backupInterval')}>
                  <Input type="number" dir="ltr" min={1} max={30} className="min-h-[44px] w-32" value={s.backupIntervalDays} onChange={(e) => setS({ ...s, backupIntervalDays: Number(e.target.value) })} />
                </Field>
                <div className="rounded-lg bg-muted/60 p-3 text-sm">
                  <span className="text-muted-foreground">{t('settings.lastBackup')}: </span>
                  <span className="tnum font-bold">{lastBackup === '—' ? '—' : fmtDateTime(lastBackup)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="min-h-[44px]" onClick={backupNow}>
                    <DatabaseBackup className="me-2 h-4 w-4" />{t('settings.backupNow')}
                  </Button>
                  <Button variant="destructive" className="min-h-[44px]" onClick={() => setResetOpen(true)}>
                    <RotateCcw className="me-2 h-4 w-4" />{t('common.resetDemo')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- certificate template ---------- */}
        <TabsContent value="template">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-extrabold">{t('settings.template')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label={t('settings.centerName')}>
                  <Input className="min-h-[44px]" value={tpl.centerName} onChange={(e) => setTpl({ ...tpl, centerName: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('settings.logoText')}>
                    <Input className="min-h-[44px]" maxLength={2} value={tpl.logoText} onChange={(e) => setTpl({ ...tpl, logoText: e.target.value })} />
                  </Field>
                  <Field label={t('settings.signature')}>
                    <Input className="min-h-[44px]" value={tpl.signatureName} onChange={(e) => setTpl({ ...tpl, signatureName: e.target.value })} />
                  </Field>
                </div>
                <Field label={t('settings.bodyText')}>
                  <Textarea rows={4} value={tpl.bodyText} onChange={(e) => setTpl({ ...tpl, bodyText: e.target.value })} />
                </Field>
                <Button className="min-h-[44px]" onClick={saveTemplate}>
                  <Save className="me-2 h-4 w-4" />{t('common.save')}
                </Button>
              </CardContent>
            </Card>

            {/* live preview */}
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base font-extrabold"><Award className="h-4 w-4 text-primary" />{t('settings.preview')}</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border-[3px] border-double border-primary/70 bg-white p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-white">{tpl.logoText}</div>
                    <div className="font-black text-primary">{tpl.centerName}</div>
                  </div>
                  <div className="mt-4 text-xs font-bold tracking-widest text-muted-foreground">{t('cert.certifies')}</div>
                  <div className="mt-1 text-xl font-black">{t('common.student')}</div>
                  <p className="mx-auto mt-3 max-w-md text-xs leading-loose text-muted-foreground">{tpl.bodyText}</p>
                  <div className="mt-5 flex items-end justify-between text-xs">
                    <span className="tnum text-muted-foreground">{fmtDateTime(new Date().toISOString()).slice(0, 10)}</span>
                    <span className="font-extrabold">{tpl.signatureName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.resetDemo')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.resetConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-[44px]">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                dispatch({ type: 'RESET' })
                localStorage.removeItem('ecms-last-backup')
                toast.success(t('common.resetDone'))
                setResetOpen(false)
              }}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
