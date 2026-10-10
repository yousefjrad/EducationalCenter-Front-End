import { useMemo, useState } from 'react'
import { Users2, Plus, Pencil, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { useStore, useCan } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import type { PayrollType, Trainer } from '@/types'
import { fmtSYP } from '@/lib/format'
import { PageHeader, SearchInput, EmptyState, Pill, Field } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const emptyForm = {
  name: '', phone: '', specialty: '', payrollType: 'fixed' as PayrollType,
  fixedSalary: '', hourlyRate: '', percentage: '',
}

export default function Trainers() {
  const { t, lang } = useI18n()
  const { state, dispatch } = useStore()
  const canManage = useCan('Trainers.Manage')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Trainer | null>(null)
  const [form, setForm] = useState(emptyForm)

  const list = useMemo(
    () => state.trainers.filter((x) => (x.name + x.specialty + x.phone).includes(q.trim())),
    [state.trainers, q],
  )

  const payrollLabel = (x: Trainer) => {
    if (x.payrollType === 'fixed') return `${t('trainers.fixed')} — ${fmtSYP(x.fixedSalary ?? 0, lang)}`
    if (x.payrollType === 'hourly') return `${t('trainers.hourly')} — ${fmtSYP(x.hourlyRate ?? 0, lang)}`
    return `${t('trainers.percentage')} — ${x.percentage}%`
  }

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (x: Trainer) => {
    setEditing(x)
    setForm({
      name: x.name, phone: x.phone, specialty: x.specialty, payrollType: x.payrollType,
      fixedSalary: x.fixedSalary?.toString() ?? '', hourlyRate: x.hourlyRate?.toString() ?? '',
      percentage: x.percentage?.toString() ?? '',
    })
    setOpen(true)
  }

  const save = () => {
    if (!form.name.trim()) { toast.error(t('common.required')); return }
    const trainer: Trainer = {
      id: editing?.id ?? 0,
      name: form.name.trim(), phone: form.phone.trim(), specialty: form.specialty.trim(),
      payrollType: form.payrollType,
      fixedSalary: form.payrollType === 'fixed' ? Number(form.fixedSalary) || 0 : undefined,
      hourlyRate: form.payrollType === 'hourly' ? Number(form.hourlyRate) || 0 : undefined,
      percentage: form.payrollType === 'percentage' ? Number(form.percentage) || 0 : undefined,
      active: editing?.active ?? true,
    }
    dispatch({ type: 'SAVE_TRAINER', trainer })
    toast.success(t('common.saved'))
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title={t('trainers.title')} subtitle={t('trainers.subtitle')}
        actions={canManage && <Button className="min-h-[44px]" onClick={openNew}><Plus className="me-2 h-4 w-4" />{t('trainers.add')}</Button>}
      />

      <SearchInput value={q} onChange={setQ} className="mb-4 max-w-sm" />

      {list.length === 0 ? (
        <EmptyState message={q ? t('common.noResults') : t('trainers.empty')} icon={<Users2 className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((x) => {
            const secs = state.sections.filter((s) => s.trainerId === x.id && s.status === 'open')
            return (
              <div key={x.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                      {x.name[0]}
                    </div>
                    <div>
                      <div className="font-extrabold">{x.name}</div>
                      <div className="text-xs text-muted-foreground">{x.specialty}</div>
                    </div>
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(x)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="tnum mt-3 text-sm text-muted-foreground" dir="ltr">{x.phone}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Pill tone="teal">{payrollLabel(x)}</Pill>
                  <Pill tone="blue"><CalendarDays className="h-3 w-3" />{secs.length} {t('trainers.activeSections')}</Pill>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? t('trainers.edit') : t('trainers.add')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('common.name')} required>
              <Input className="min-h-[44px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('common.phone')}>
              <Input dir="ltr" className="min-h-[44px]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label={t('trainers.specialty')}>
              <Input className="min-h-[44px] sm:col-span-2" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </Field>
            <Field label={t('trainers.payrollType')}>
              <Select value={form.payrollType} onValueChange={(v) => setForm({ ...form, payrollType: v as PayrollType })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t('trainers.fixed')}</SelectItem>
                  <SelectItem value="hourly">{t('trainers.hourly')}</SelectItem>
                  <SelectItem value="percentage">{t('trainers.percentage')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.payrollType === 'fixed' && (
              <Field label={t('trainers.fixedSalary')}>
                <Input type="number" dir="ltr" className="min-h-[44px]" value={form.fixedSalary} onChange={(e) => setForm({ ...form, fixedSalary: e.target.value })} />
              </Field>
            )}
            {form.payrollType === 'hourly' && (
              <Field label={t('trainers.hourlyRate')}>
                <Input type="number" dir="ltr" className="min-h-[44px]" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
              </Field>
            )}
            {form.payrollType === 'percentage' && (
              <Field label={t('trainers.percentageVal')}>
                <Input type="number" dir="ltr" className="min-h-[44px]" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} />
              </Field>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="min-h-[44px]" onClick={save}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
