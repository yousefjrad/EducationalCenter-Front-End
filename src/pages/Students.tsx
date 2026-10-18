import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Pencil, Power, KeyRound, ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import { useCan } from '@/lib/can'
import { BranchBadge } from '@/lib/branchNames'
import { useI18n } from '@/lib/i18n'
import { ApiError } from '@/services/api'
import { studentsApi, type StudentDto } from '@/services/students'
import { branchesApi, type BranchDto } from '@/services/branches'
import { hasPermission } from '@/lib/permissions'
import { PageHeader, SearchInput, EmptyState, Pill, Field, TableScroll, Th, Td } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const PAGE_SIZE = 25
const errText = (e: unknown) => (e instanceof ApiError ? e.message : String(e))

export default function Students() {
  const { t, lang } = useI18n()
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const canManage = useCan('Students.Manage')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<StudentDto[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [editStudent, setEditStudent] = useState<StudentDto | 'new' | null>(null)
  const [accountFor, setAccountFor] = useState<StudentDto | null>(null)
  const [transferFor, setTransferFor] = useState<StudentDto | null>(null)
  const canTransfer = hasPermission('Students.Transfer')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      studentsApi.list({ search: q.trim() || undefined, page, pageSize: PAGE_SIZE })
        .then((r) => { if (alive) { setItems(r.items); setTotal(r.totalCount); setTotalPages(Math.max(1, r.totalPages)) } })
        .catch((e) => { if (alive) setError(errText(e)) })
        .finally(() => { if (alive) setLoading(false) })
    }, q ? 300 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, page, reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  const toggleActive = async (s: StudentDto) => {
    try {
      await studentsApi.update(s.id, { fullName: s.fullName, phoneNumber: s.phoneNumber, isActive: !s.isActive })
      toast.success(L(s.isActive ? 'تم التعطيل' : 'تم التفعيل', s.isActive ? 'Deactivated' : 'Activated'))
      reload()
    } catch (e) {
      toast.error(errText(e))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('students.title')} subtitle={t('students.subtitle')}
        actions={canManage && (
          <Button className="min-h-[44px]" onClick={() => setEditStudent('new')}>
            <Plus className="me-2 h-4 w-4" />{t('students.add')}
          </Button>
        )}
      />

      <SearchInput value={q} onChange={(v: string) => { setQ(v); setPage(1) }} className="mb-4 max-w-sm" />

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
        <EmptyState message={q ? t('common.noResults') : t('students.empty')} icon={<GraduationCap className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <>
          <div className="mb-2 text-xs text-muted-foreground tnum">{total}</div>
          <TableScroll>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <Th>{t('common.name')}</Th>
                  <Th>{t('common.phone')}</Th>
                  <Th>{t('common.status')}</Th>
                  {canManage && <Th>{t('common.actions')}</Th>}
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                    <Td><span className="font-bold">{s.fullName}</span><BranchBadge ids={s.branchId} /></Td>
                    <Td><span className="tnum" dir="ltr">{s.phoneNumber}</span></Td>
                    <Td>{s.isActive ? <Pill tone="green">{t('common.active')}</Pill> : <Pill tone="gray">{t('common.inactive')}</Pill>}</Td>
                    {canManage && (
                      <Td>
                        <div className="flex gap-1">
                          {canTransfer && (
                            <Button variant="ghost" size="icon" className="h-9 w-9" title={L('\u0646\u0642\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u0625\u0644\u0649 \u0641\u0631\u0639 \u0622\u062e\u0631', 'Transfer to another branch')} onClick={() => setTransferFor(s)}>
                              <ArrowLeftRight className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-9 w-9" title={L('تعديل', 'Edit')} onClick={() => setEditStudent(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" title={L('إنشاء حساب دخول', 'Create sign-in account')} onClick={() => setAccountFor(s)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className={s.isActive ? 'h-9 w-9 text-destructive' : 'h-9 w-9 text-[hsl(var(--success))]'}
                            title={s.isActive ? L('تعطيل', 'Deactivate') : L('تفعيل', 'Activate')}
                            onClick={() => toggleActive(s)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{L('السابق', 'Previous')}</Button>
              <span className="tnum text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{L('التالي', 'Next')}</Button>
            </div>
          )}
        </>
      )}

      <StudentDialog target={editStudent} onClose={() => setEditStudent(null)} onSaved={reload} />
      <AccountDialog student={accountFor} onClose={() => setAccountFor(null)} />
      <TransferDialog student={transferFor} onClose={() => setTransferFor(null)} onDone={reload} />
    </div>
  )
}

function StudentDialog({ target, onClose, onSaved }: { target: StudentDto | 'new' | null; onClose: () => void; onSaved: () => void }) {
  const { t, lang } = useI18n()
  const editing = target !== null && target !== 'new' ? target : null
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(editing?.fullName ?? '')
    setPhone(editing?.phoneNumber ?? '')
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!name.trim() || !phone.trim()) { toast.error(t('common.required')); return }
    if (!/^\+?[0-9\s\-()]{6,20}$/.test(phone.trim())) {
      toast.error(lang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number')
      return
    }
    setSaving(true)
    try {
      const body = { fullName: name.trim(), phoneNumber: phone.trim() }
      if (editing) await studentsApi.update(editing.id, { ...body, isActive: editing.isActive })
      else await studentsApi.create(body)
      toast.success(t('common.saved'))
      onSaved()
      onClose()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? t('students.edit') : t('students.add')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label={t('common.name')} required>
            <Input className="min-h-[44px]" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('common.phone')} required>
            <Input dir="ltr" className="min-h-[44px]" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="min-h-[44px]" onClick={save} disabled={saving}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TransferDialog({ student, onClose, onDone }: { student: StudentDto | null; onClose: () => void; onDone: () => void }) {
  const { t, lang } = useI18n()
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const [branches, setBranches] = useState<BranchDto[]>([])
  const [target, setTarget] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!student) return
    setTarget('')
    setReason('')
    branchesApi.list()
      .then((r) => setBranches(r.filter((b) => b.isActive)))
      .catch((e) => toast.error(errText(e)))
  }, [student])

  const save = async () => {
    if (!student || !target || !reason.trim()) { toast.error(t('common.required')); return }
    setSaving(true)
    try {
      await studentsApi.transfer(student.id, { targetBranchId: Number(target), reason: reason.trim() })
      toast.success(L('\u062a\u0645 \u0646\u0642\u0644 \u0627\u0644\u0637\u0627\u0644\u0628', 'Student transferred'))
      onDone()
      onClose()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={student !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{L('\u0646\u0642\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u0625\u0644\u0649 \u0641\u0631\u0639 \u0622\u062e\u0631', 'Transfer to another branch')}{student ? ' - ' + student.fullName : ''}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {L('\u064a\u0646\u062a\u0642\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u0645\u0639 \u062d\u0633\u0627\u0628 \u062f\u062e\u0648\u0644\u0647 \u0625\u0644\u0649 \u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u062c\u062f\u064a\u062f. \u064a\u064f\u0631\u0641\u0636 \u0627\u0644\u0646\u0642\u0644 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0644\u062f\u064a\u0647 \u062a\u0633\u062c\u064a\u0644\u0627\u062a \u0623\u0648 \u0623\u0642\u0633\u0627\u0637 \u0645\u0641\u062a\u0648\u062d\u0629\u060c \u0648\u062a\u0638\u0647\u0631 \u0644\u0643 \u0631\u0633\u0627\u0644\u0629 \u0628\u0627\u0644\u0633\u0628\u0628.', 'The student moves with the sign-in account to the new branch. The transfer is refused while the student has open enrollments or installments, and the reason is shown.')}
        </p>
        <div className="space-y-3">
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">{L('\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u062c\u062f\u064a\u062f', 'Choose the new branch')}</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <Input
            className="min-h-[44px]" maxLength={300}
            placeholder={L('\u0633\u0628\u0628 \u0627\u0644\u0646\u0642\u0644 (\u0645\u0637\u0644\u0648\u0628)', 'Reason (required)')}
            value={reason} onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="min-h-[44px]" onClick={save} disabled={saving || !target || !reason.trim()}>{L('\u0646\u0642\u0644', 'Transfer')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AccountDialog({ student, onClose }: { student: StudentDto | null; onClose: () => void }) {
  const { t, lang } = useI18n()
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setEmail(''); setPassword('') }, [student])

  const save = async () => {
    if (!student) return
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { toast.error(L('البريد الإلكتروني غير صحيح', 'Invalid email')); return }
    if (!password) { toast.error(t('common.required')); return }
    setSaving(true)
    try {
      await studentsApi.createAccount(student.id, { email: email.trim(), password })
      toast.success(L('تم إنشاء حساب الدخول', 'Account created'))
      onClose()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={student !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{L('إنشاء حساب دخول', 'Create sign-in account')}{student ? ' - ' + student.fullName : ''}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {L('يستطيع الطالب بهذا الحساب الدخول إلى بوابة الطالب.', 'The student can use this account to sign in to the student portal.')}
        </p>
        <div className="space-y-4">
          <Field label={t('common.email')} required>
            <Input type="email" dir="ltr" className="min-h-[44px]" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          </Field>
          <Field label={L('كلمة المرور', 'Password')} required>
            <Input type="password" dir="ltr" className="min-h-[44px]" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="min-h-[44px]" onClick={save} disabled={saving}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}