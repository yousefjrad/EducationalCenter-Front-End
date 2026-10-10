import { useState } from 'react'
import { ShieldCheck, Plus, Pencil, Trash2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import type { PermissionKey, Role, User } from '@/types'
import { PageHeader, EmptyState, Pill, Field, TableScroll, Th, Td } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PERM_GROUPS: { key: string; perms: PermissionKey[] }[] = [
  { key: 'perm.group.academic', perms: ['Dashboard.View', 'Courses.View', 'Courses.Manage', 'Sections.View', 'Sections.Manage', 'Trainers.View', 'Trainers.Manage'] },
  { key: 'perm.group.students', perms: ['Students.View', 'Students.Manage', 'Enrollments.Manage'] },
  { key: 'perm.group.finance', perms: ['Payments.View', 'Payments.Create', 'Payments.Void', 'Expenses.Manage', 'Payroll.Manage'] },
  { key: 'perm.group.ops', perms: ['Attendance.Manage', 'Grades.Manage', 'Certificates.Issue', 'Certificates.Override', 'Reports.View'] },
  { key: 'perm.group.system', perms: ['Users.Manage', 'Audit.View', 'Settings.Manage'] },
]

export default function Users() {
  const { t, lang } = useI18n()
  const { state, dispatch } = useStore()
  const [editUser, setEditUser] = useState<User | 'new' | null>(null)
  const [editRole, setEditRole] = useState<Role | 'new' | null>(null)

  return (
    <div>
      <PageHeader title={t('users.title')} subtitle={t('users.subtitle')} />

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="min-h-[44px]">{t('users.tab.users')}</TabsTrigger>
          <TabsTrigger value="roles" className="min-h-[44px]">{t('users.tab.roles')}</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="mb-4 flex justify-end">
            <Button className="min-h-[44px]" onClick={() => setEditUser('new')}>
              <Plus className="me-2 h-4 w-4" />{t('users.add')}
            </Button>
          </div>
          {state.users.length === 0 ? (
            <EmptyState message={t('users.empty')} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr><Th>{t('common.name')}</Th><Th>{t('common.email')}</Th><Th>{t('users.role')}</Th><Th>{t('common.status')}</Th><Th></Th></tr>
                </thead>
                <tbody>
                  {state.users.map((u) => {
                    const role = state.roles.find((r) => r.id === u.roleId)
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/40">
                        <Td className="font-bold">{u.name}</Td>
                        <Td><span className="tnum text-muted-foreground" dir="ltr">{u.email}</span></Td>
                        <Td><Pill tone={role?.builtin ? 'purple' : 'teal'}>{lang === 'ar' ? role?.name : role?.nameEn}</Pill></Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.active}
                              onCheckedChange={(v) => dispatch({ type: 'SAVE_USER', user: { ...u, active: v } })}
                              disabled={u.id === state.currentUserId}
                            />
                            <span className="text-xs text-muted-foreground">{u.active ? t('common.active') : t('common.inactive')}</span>
                          </div>
                        </Td>
                        <Td>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditUser(u)}>
                            <Pencil className="h-4 w-4" />
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

        <TabsContent value="roles">
          <div className="mb-4 flex justify-end">
            <Button className="min-h-[44px]" onClick={() => setEditRole('new')}>
              <Plus className="me-2 h-4 w-4" />{t('users.addRole')}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.roles.map((r) => {
              const usersCount = state.users.filter((u) => u.roleId === r.id).length
              return (
                <div key={r.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 font-extrabold">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        {lang === 'ar' ? r.name : r.nameEn}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{r.permissions.length} {t('users.permissions')}</div>
                    </div>
                    {r.builtin && <Pill tone="purple"><Lock className="h-3 w-3" />{t('users.builtin')}</Pill>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.permissions.slice(0, 5).map((p) => (
                      <span key={p} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground" dir="ltr">{p}</span>
                    ))}
                    {r.permissions.length > 5 && <span className="text-[10px] text-muted-foreground">+{r.permissions.length - 5}</span>}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="tnum text-xs text-muted-foreground">{usersCount} {t('users.tab.users')}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="min-h-[36px]" onClick={() => setEditRole(r)}>
                        {r.id === 1 ? t('common.view') : t('common.edit')}
                      </Button>
                      {!r.builtin && (
                        <Button
                          variant="ghost" size="icon" className="h-9 w-9 text-destructive"
                          onClick={() => {
                            if (usersCount > 0) { toast.error(t('users.roleInUse')); return }
                            dispatch({ type: 'DELETE_ROLE', id: r.id })
                            toast.success(t('common.deleted'))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <UserDialog target={editUser} onClose={() => setEditUser(null)} />
      <RoleDialog target={editRole} onClose={() => setEditRole(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------

function UserDialog({ target, onClose }: { target: User | 'new' | null; onClose: () => void }) {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const editing = target !== 'new' ? target : null
  const [name, setName] = useState(editing?.name ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [password, setPassword] = useState(editing?.password ?? '')
  const [roleId, setRoleId] = useState(String(editing?.roleId ?? ''))

  const save = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !roleId) { toast.error(t('common.required')); return }
    dispatch({
      type: 'SAVE_USER',
      user: editing
        ? { ...editing, name: name.trim(), email: email.trim(), password, roleId: Number(roleId) }
        : { id: 0, name: name.trim(), email: email.trim(), password, roleId: Number(roleId), active: true, createdAt: new Date().toISOString().slice(0, 10) },
    })
    toast.success(t('common.saved'))
    onClose()
  }

  return (
    <Dialog open={target !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? t('users.edit') : t('users.add')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label={t('common.name')} required><Input className="min-h-[44px]" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t('common.email')} required><Input type="email" dir="ltr" className="min-h-[44px]" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label={t('users.passwordHint')} required><Input dir="ltr" className="min-h-[44px]" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Field label={t('users.role')} required>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {state.roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="min-h-[44px]" onClick={save}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------

function RoleDialog({ target, onClose }: { target: Role | 'new' | null; onClose: () => void }) {
  const { t } = useI18n()
  const { dispatch } = useStore()
  const editing = target !== 'new' ? target : null
  const isAdminRole = editing?.id === 1
  const [name, setName] = useState(editing?.name ?? '')
  const [nameEn, setNameEn] = useState(editing?.nameEn ?? '')
  const [perms, setPerms] = useState<PermissionKey[]>(editing?.permissions ?? [])

  const toggle = (p: PermissionKey) =>
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const save = () => {
    if (!name.trim()) { toast.error(t('common.required')); return }
    dispatch({
      type: 'SAVE_ROLE',
      role: editing
        ? { ...editing, name: name.trim(), nameEn: nameEn.trim(), permissions: perms }
        : { id: 0, name: name.trim(), nameEn: nameEn.trim(), builtin: false, permissions: perms },
    })
    toast.success(t('common.saved'))
    onClose()
  }

  return (
    <Dialog open={target !== null} onOpenChange={onClose}>
      <DialogContent className="scrollbar-thin max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? t('users.editRole') : t('users.addRole')}</DialogTitle></DialogHeader>
        {isAdminRole && (
          <div className="mb-3 rounded-lg bg-muted p-3 text-xs font-bold text-muted-foreground">{t('users.cantDeleteAdmin')}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('users.roleName')} required>
            <Input className="min-h-[44px]" value={name} onChange={(e) => setName(e.target.value)} disabled={isAdminRole} />
          </Field>
          <Field label={t('users.roleNameEn')}>
            <Input dir="ltr" className="min-h-[44px]" value={nameEn} onChange={(e) => setNameEn(e.target.value)} disabled={isAdminRole} />
          </Field>
        </div>

        <div className="mt-4 space-y-4">
          {PERM_GROUPS.map((g) => (
            <div key={g.key} className="rounded-xl border p-4">
              <div className="mb-3 text-sm font-extrabold">{t(g.key)}</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {g.perms.map((p) => (
                  <label key={p} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg px-2 hover:bg-muted/60">
                    <Checkbox checked={perms.includes(p)} onCheckedChange={() => toggle(p)} disabled={isAdminRole} />
                    <span className="text-sm" dir="ltr">{p}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={onClose}>{t('common.close')}</Button>
          {!isAdminRole && <Button className="min-h-[44px]" onClick={save}>{t('common.save')}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
