import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useEffect, useState } from 'react'
import { Users2, Plus, Pencil, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCan } from '@/lib/can'
import { useAuth } from '@/lib/auth'
import { BranchBadge } from '@/lib/branchNames'
import { useI18n } from '@/lib/i18n'
import { ApiError } from '@/services/api'
import { trainersApi, type TrainerDto, type TrainerInput, type PayType, type PayCurrency } from '@/services/trainers'
import { fmtSYP } from '@/lib/format'
import { PageHeader, SearchInput, EmptyState, Pill, Field } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const emptyForm = {
  name: '', phone: '', specialty: '', payType: 'Monthly' as PayType, value: '', currency: 'Syp' as PayCurrency,
}

const errText = (e: unknown) => (e instanceof ApiError ? e.message : String(e))

export default function Trainers() {
  const { t, lang } = useI18n()
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const { isSuperAdmin, activeBranchId } = useAuth()
  const canManage = useCan('Trainers.Manage') && !(isSuperAdmin && !activeBranchId)
  const canDelete = useCan('Trainers.Delete') && canManage
  const [q, setQ] = useState('')
  const [items, setItems] = useState<TrainerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<TrainerDto | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      trainersApi.list({ search: q.trim() || undefined, pageSize: 100 })
        .then((r) => { if (alive) setItems(r.items) })
        .catch((e) => { if (alive) setError(errText(e)) })
        .finally(() => { if (alive) setLoading(false) })
    }, q ? 300 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  const money = (x: TrainerDto) =>
    x.payCurrency === 'Usd' ? '$' + Number(x.payValue).toLocaleString('en-US') : fmtSYP(x.payValue, lang)

  const payLabel = (x: TrainerDto) => {
    if (x.payType === 'Monthly') return t('trainers.fixed') + ' - ' + money(x)
    if (x.payType === 'Hourly') return t('trainers.hourly') + ' - ' + money(x)
    return t('trainers.percentage') + ' - ' + x.payValue + '%'
  }

  const valueLabel = (p: PayType) =>
    p === 'Monthly' ? t('trainers.fixedSalary') : p === 'Hourly' ? t('trainers.hourlyRate') : t('trainers.percentageVal')

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (x: TrainerDto) => {
    setEditing(x)
    setForm({
      name: x.fullName, phone: x.phoneNumber, specialty: x.specialty ?? '', payType: x.payType,
      value: String(x.payValue), currency: x.payCurrency,
    })
    setOpen(true)
  }

  const save = async () => {
    const value = Number(form.value || 0)
    if (!form.name.trim() || !form.phone.trim()) { toast.error(t('common.required')); return }
    if (!/^\+?[0-9\s\-()]{6,20}$/.test(form.phone.trim())) {
      toast.error(L('رقم الهاتف غير صحيح', 'Invalid phone number'))
      return
    }
    if (!(value >= 0)) { toast.error(L('القيمة غير صحيحة', 'Invalid value')); return }
    if (form.payType === 'Percentage' && value > 100) {
      toast.error(L('النسبة لا تتجاوز 100', 'Percentage cannot exceed 100'))
      return
    }
    const body: TrainerInput = {
      fullName: form.name.trim(), phoneNumber: form.phone.trim(), specialty: form.specialty.trim() || null,
      payType: form.payType, payValue: value, payCurrency: form.payType === 'Percentage' ? 'Syp' : form.currency,
    }
    setSaving(true)
    try {
      if (editing) await trainersApi.update(editing.id, { ...body, isActive: editing.isActive })
      else await trainersApi.create(body)
      toast.success(t('common.saved'))
      setOpen(false)
      reload()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (x: TrainerDto) => {
    try {
      await trainersApi.update(x.id, {
        fullName: x.fullName, phoneNumber: x.phoneNumber, specialty: x.specialty,
        payType: x.payType, payValue: x.payValue, payCurrency: x.payCurrency, isActive: !x.isActive,
      })
      toast.success(L(x.isActive ? 'تم التعطيل' : 'تم التفعيل', x.isActive ? 'Deactivated' : 'Activated'))
      reload()
    } catch (e) {
      toast.error(errText(e))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('trainers.title')} subtitle={t('trainers.subtitle')}
        actions={canManage && <Button className="min-h-[44px]" onClick={openNew}><Plus className="me-2 h-4 w-4" />{t('trainers.add')}</Button>}
      />

      <SearchInput value={q} onChange={setQ} className="mb-4 max-w-sm" />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>{L('إعادة المحاولة', 'Retry')}</Button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState message={q ? t('common.noResults') : t('trainers.empty')} icon={<Users2 className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((x) => (
            <div key={x.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                    {x.fullName[0]}
                  </div>
                  <div>
                    <div className="font-extrabold">{x.fullName}<BranchBadge ids={x.branchIds} /></div>
                    <div className="text-xs text-muted-foreground">{x.specialty ?? ''}</div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(x)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className={x.isActive ? 'h-9 w-9 text-destructive' : 'h-9 w-9 text-[hsl(var(--success))]'}
                      onClick={() => toggleActive(x)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" title={L('\u062d\u0630\u0641', 'Delete')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{L('\u062d\u0630\u0641 \u0627\u0644\u0645\u062f\u0631\u0628', 'Delete trainer')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {L('\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641', 'Are you sure you want to delete')} <b>{x.fullName}</b>{'\u061f'} {L('\u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.', 'This cannot be undone.')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="min-h-[44px]">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
                              onClick={async () => {
                                try {
                                  await trainersApi.remove(x.id)
                                  toast.success(L('\u062a\u0645 \u0627\u0644\u062d\u0630\u0641', 'Deleted'))
                                  reload()
                                } catch (e) {
                                  toast.error(errText(e))
                                }
                              }}
                            >
                              {L('\u062d\u0630\u0641', 'Delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                  </div>
                )}
              </div>
              <div className="tnum mt-3 text-sm text-muted-foreground" dir="ltr">{x.phoneNumber}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone="teal">{payLabel(x)}</Pill>
                {!x.isActive && <Pill tone="gray">{t('common.inactive')}</Pill>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? t('trainers.edit') : t('trainers.add')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('common.name')} required>
              <Input className="min-h-[44px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('common.phone')} required>
              <Input dir="ltr" className="min-h-[44px]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label={t('trainers.specialty')}>
              <Input className="min-h-[44px]" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </Field>
            <Field label={t('trainers.payrollType')}>
              <Select value={form.payType} onValueChange={(v) => setForm({ ...form, payType: v as PayType })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">{t('trainers.fixed')}</SelectItem>
                  <SelectItem value="Hourly">{t('trainers.hourly')}</SelectItem>
                  <SelectItem value="Percentage">{t('trainers.percentage')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={valueLabel(form.payType)}>
              <Input type="number" min={0} dir="ltr" className="min-h-[44px]" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </Field>
            {form.payType !== 'Percentage' && (
              <Field label={L('العملة', 'Currency')}>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v as PayCurrency })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Syp">{L('ليرة سورية', 'SYP')}</SelectItem>
                    <SelectItem value="Usd">{L('دولار', 'USD')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="min-h-[44px]" onClick={save} disabled={saving}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}