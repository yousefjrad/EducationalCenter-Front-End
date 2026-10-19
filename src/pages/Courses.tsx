import { useEffect, useState } from 'react'
import { BookOpen, Plus, Pencil, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCan } from '@/lib/can'
import { useAuth } from '@/lib/auth'
import { BranchBadge } from '@/lib/branchNames'
import { useI18n } from '@/lib/i18n'
import { ApiError } from '@/services/api'
import { coursesApi, type CourseDto, type CourseInput } from '@/services/courses'
import { PageHeader, SearchInput, EmptyState, Pill, Field, TableScroll, Th, Td } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all']
const levelTone: Record<string, 'green' | 'blue' | 'purple' | 'gray'> = {
  beginner: 'green', intermediate: 'blue', advanced: 'purple', all: 'gray',
}

const emptyForm = { code: '', name: '', description: '', level: 'beginner', hours: '40', price: '0' }

const errText = (e: unknown) => (e instanceof ApiError ? e.message : String(e))

export default function Courses() {
  const { t, lang } = useI18n()
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const { isSuperAdmin, activeBranchId } = useAuth()
  const canManage = useCan('Courses.Manage') && !(isSuperAdmin && !activeBranchId)
  const canDelete = useCan('Courses.Delete') && !(isSuperAdmin && !activeBranchId)
  const [confirmDelete, setConfirmDelete] = useState<CourseDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [q, setQ] = useState('')
  const [items, setItems] = useState<CourseDto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<CourseDto | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      coursesApi.list({ search: q.trim() || undefined, pageSize: 100 })
        .then((r) => { if (alive) { setItems(r.items); setTotal(r.totalCount) } })
        .catch((e) => { if (alive) setError(errText(e)) })
        .finally(() => { if (alive) setLoading(false) })
    }, q ? 300 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (c: CourseDto) => {
    setEditing(c)
    setForm({
      code: c.code, name: c.name, description: c.description ?? '', level: c.level ?? 'beginner',
      hours: String(c.defaultDurationHours), price: String(c.defaultPrice),
    })
    setOpen(true)
  }

  const save = async () => {
    const code = form.code.trim()
    const hours = Number(form.hours)
    const price = Number(form.price)
    if (!code || !form.name.trim()) { toast.error(t('common.required')); return }
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(code)) {
      toast.error(L('الرمز: حروف وأرقام و - و _ فقط (حتى 20 خانة)', 'Code: letters, digits, - and _ only (max 20)'))
      return
    }
    if (!Number.isInteger(hours) || hours < 1 || hours > 10000) {
      toast.error(L('المدة يجب أن تكون بين 1 و 10000 ساعة', 'Duration must be between 1 and 10000 hours'))
      return
    }
    if (!(price >= 0)) { toast.error(L('السعر غير صحيح', 'Invalid price')); return }

    const body: CourseInput = {
      code, name: form.name.trim(), description: form.description.trim() || null,
      level: form.level, defaultDurationHours: hours, defaultPrice: price,
    }
    setSaving(true)
    try {
      if (editing) await coursesApi.update(editing.id, { ...body, isActive: editing.isActive, rowVersion: editing.rowVersion })
      else await coursesApi.create(body)
      toast.success(t('common.saved'))
      setOpen(false)
      reload()
    } catch (e) {
      toast.error(errText(e))
      if (String(errText(e)).includes('changed by another user')) { setOpen(false); reload() }
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (c: CourseDto) => {
    try {
      await coursesApi.update(c.id, {
        rowVersion: c.rowVersion,
        code: c.code, name: c.name, description: c.description, level: c.level,
        defaultDurationHours: c.defaultDurationHours, defaultPrice: c.defaultPrice, isActive: !c.isActive,
      })
      toast.success(t(c.isActive ? 'courses.deactivated' : 'courses.activated'))
      reload()
    } catch (e) {
      toast.error(errText(e))
      reload()
    }
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await coursesApi.remove(confirmDelete.id)
      toast.success(L('\u062a\u0645 \u0627\u0644\u062d\u0630\u0641', 'Deleted'))
      setConfirmDelete(null)
      reload()
    } catch (e) {
      toast.error(errText(e))
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const levelLabel = (l: string | null) => (l && LEVELS.includes(l) ? t('courses.level.' + l) : l ?? '-')
  const tone = (l: string | null) => (l && levelTone[l]) || 'gray'
  const money = (n: number) => Number(n).toLocaleString('en-US') + ' ' + L('ل.س', 'SYP')

  return (
    <div>
      <PageHeader
        title={t('courses.title')} subtitle={t('courses.subtitle')}
        actions={canManage && (
          <Button className="min-h-[44px]" onClick={openNew}><Plus className="me-2 h-4 w-4" />{t('courses.add')}</Button>
        )}
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
        <EmptyState message={q ? t('common.noResults') : t('courses.empty')} icon={<BookOpen className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <>
          <div className="mb-2 text-xs text-muted-foreground tnum">{total}</div>

          <div className="grid gap-3 md:hidden">
            {items.map((c) => (
              <div key={c.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-extrabold">{c.name}<BranchBadge ids={c.branchIds} /></div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{c.code}</div>
                  </div>
                  <Pill tone={tone(c.level)}>{levelLabel(c.level)}</Pill>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-2 text-xs text-muted-foreground tnum">
                  {c.defaultDurationHours} {L('ساعة', 'h')} - {money(c.defaultPrice)}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {!c.isActive ? <Pill tone="gray">{t('common.inactive')}</Pill> : <span />}
                  {canManage && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      {canDelete && <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive" onClick={() => setConfirmDelete(c)}><Trash2 className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon" className={cnActive(c.isActive)} onClick={() => toggleActive(c)}><Power className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <TableScroll>
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr>
                    <Th>{t('common.name')}</Th>
                    <Th>{t('courses.description')}</Th>
                    <Th>{t('courses.level')}</Th>
                    <Th>{L('المدة (ساعات)', 'Hours')}</Th>
                    <Th>{L('السعر', 'Price')}</Th>
                    <Th>{t('common.status')}</Th>
                    {canManage && <Th>{t('common.actions')}</Th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                      <Td>
                        <div className="font-bold">{c.name}<BranchBadge ids={c.branchIds} /></div>
                        <div className="text-xs text-muted-foreground" dir="ltr">{c.code}</div>
                      </Td>
                      <Td className="max-w-[300px]"><span className="line-clamp-2 text-muted-foreground">{c.description}</span></Td>
                      <Td><Pill tone={tone(c.level)}>{levelLabel(c.level)}</Pill></Td>
                      <Td><span className="tnum">{c.defaultDurationHours}</span></Td>
                      <Td><span className="tnum">{money(c.defaultPrice)}</span></Td>
                      <Td>{c.isActive ? <Pill tone="green">{t('common.active')}</Pill> : <Pill tone="gray">{t('common.inactive')}</Pill>}</Td>
                      {canManage && (
                        <Td>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                            {canDelete && <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setConfirmDelete(c)}><Trash2 className="h-4 w-4" /></Button>}
                            <Button variant="ghost" size="icon" className={cnActive(c.isActive)} onClick={() => toggleActive(c)}><Power className="h-4 w-4" /></Button>
                          </div>
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </div>
        </>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L('\u062d\u0630\u0641 \u0627\u0644\u0645\u0627\u062f\u0629', 'Delete course')}</AlertDialogTitle>
            <AlertDialogDescription>
              {L('\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641', 'Are you sure you want to delete')} <b>{confirmDelete?.name}</b>{'\u061f'} {L('\u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.', 'This cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-[44px]">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90" disabled={deleting} onClick={doDelete}>
              {L('\u062d\u0630\u0641', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('courses.edit') : t('courses.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={L('الرمز', 'Code')} required>
                <Input dir="ltr" className="min-h-[44px]" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </Field>
              <Field label={t('courses.level')}>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l}>{t('courses.level.' + l)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t('common.name')} required>
              <Input className="min-h-[44px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('courses.description')}>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={L('المدة (ساعات)', 'Duration (hours)')}>
                <Input type="number" min={1} dir="ltr" className="min-h-[44px]" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </Field>
              <Field label={L('السعر (ل.س)', 'Price (SYP)')}>
                <Input type="number" min={0} dir="ltr" className="min-h-[44px]" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
            </div>
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

function cnActive(active: boolean) {
  return active ? 'h-9 w-9 text-destructive' : 'h-9 w-9 text-[hsl(var(--success))]'
}