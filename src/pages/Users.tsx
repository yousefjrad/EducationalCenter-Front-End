import { useEffect, useState } from 'react'
import { KeyRound, Loader2, Pencil, Plus, ShieldCheck, Trash2, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/services/api'
import { branchesApi, type BranchDto } from '@/services/branches'
import {
  rolesApi, usersApi,
  type PermissionGroupDto, type RoleDto, type UserDto,
} from '@/services/users'

const L = {
  title: '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u0648\u0627\u0644\u0623\u062f\u0648\u0627\u0631',
  subtitle: '\u0625\u062f\u0627\u0631\u0629 \u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646 \u0648\u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0627\u0644\u0623\u062f\u0648\u0627\u0631',
  tabUsers: '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646',
  tabRoles: '\u0627\u0644\u0623\u062f\u0648\u0627\u0631',
  search: '\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064a\u062f',
  allRoles: '\u0643\u0644 \u0627\u0644\u0623\u062f\u0648\u0627\u0631',
  allStatus: '\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
  active: '\u0646\u0634\u0637',
  inactive: '\u0645\u0639\u0637\u0651\u0644',
  addUser: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062a\u062e\u062f\u0645',
  editUser: '\u062a\u0639\u062f\u064a\u0644 \u0645\u0633\u062a\u062e\u062f\u0645',
  name: '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644',
  email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
  password: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
  role: '\u0627\u0644\u062f\u0648\u0631',
  pickRole: '\u0627\u062e\u062a\u0631 \u062f\u0648\u0631\u0627\u064b',
  status: '\u0627\u0644\u062d\u0627\u0644\u0629',
  lastLogin: '\u0622\u062e\u0631 \u062f\u062e\u0648\u0644',
  locked: '\u0645\u0642\u0641\u0644',
  unlock: '\u0641\u0643 \u0627\u0644\u0642\u0641\u0644',
  resetPwd: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
  newPwd: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629',
  resetNote: '\u0633\u064a\u062a\u0645 \u0625\u0646\u0647\u0627\u0621 \u062c\u0644\u0633\u0627\u062a \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645.',
  noDeleteUser: '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u0644\u0627 \u064a\u064f\u062d\u0630\u0641\u0648\u0646\u060c \u0639\u0637\u0651\u0644 \u0627\u0644\u062d\u0633\u0627\u0628 \u0628\u062f\u0644\u0627\u064b \u0645\u0646 \u0630\u0644\u0643.',
  empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a',
  save: '\u062d\u0641\u0638',
  back: '\u0631\u062c\u0648\u0639',
  confirm: '\u062a\u0623\u0643\u064a\u062f',
  saved: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638',
  prev: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  page: '\u0635\u0641\u062d\u0629',
  addRole: '\u0625\u0636\u0627\u0641\u0629 \u062f\u0648\u0631',
  editRole: '\u062a\u0639\u062f\u064a\u0644 \u062f\u0648\u0631',
  viewRole: '\u0639\u0631\u0636 \u062f\u0648\u0631',
  roleName: '\u0627\u0633\u0645 \u0627\u0644\u062f\u0648\u0631',
  roleDesc: '\u0627\u0644\u0648\u0635\u0641',
  system: '\u0646\u0638\u0627\u0645\u064a',
  perms: '\u0635\u0644\u0627\u062d\u064a\u0629',
  edit: '\u062a\u0639\u062f\u064a\u0644',
  view: '\u0639\u0631\u0636',
  adminLocked: '\u062f\u0648\u0631 \u0627\u0644\u0645\u062f\u064a\u0631 \u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u0639\u062f\u064a\u0644\u0647.',
  sysName: '\u0627\u0644\u0623\u062f\u0648\u0627\u0631 \u0627\u0644\u0646\u0638\u0627\u0645\u064a\u0629 \u062a\u062d\u062a\u0641\u0638 \u0628\u0627\u0633\u0645\u0647\u0627.',
  needPerm: '\u0627\u062e\u062a\u0631 \u0635\u0644\u0627\u062d\u064a\u0629 \u0648\u0627\u062d\u062f\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.',
  delRole: '\u062d\u0630\u0641 \u062f\u0648\u0631',
  delConfirm: '\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u062f\u0648\u0631\u061f',
  deleted: '\u062a\u0645 \u0627\u0644\u062d\u0630\u0641',
  unlocked: '\u062a\u0645 \u0641\u0643 \u0627\u0644\u0642\u0641\u0644',
  pwdDone: '\u062a\u0645 \u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
  err: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639',
}

const LB = {
  branch: '\u0627\u0644\u0641\u0631\u0639',
  pickBranch: '\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0631\u0639 (\u0645\u0637\u0644\u0648\u0628)',
  all: '\u0643\u0644 \u0627\u0644\u0641\u0631\u0648\u0639',
  adminNoBranch: '\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0627\u0645 \u064a\u0639\u0645\u0644 \u0639\u0644\u0649 \u0643\u0644 \u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u0644\u0627 \u064a\u0631\u062a\u0628\u0637 \u0628\u0641\u0631\u0639.',
}

const PAGE_SIZE = 20
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
const th = 'border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground'
const td = 'border-b px-3 py-2.5 text-sm'
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : L.err)
const pagesOf = (t: number) => Math.max(1, Math.ceil(t / PAGE_SIZE))
const fmtDt = (s: string | null) => (s ? s.replace('T', ' ').slice(0, 16) : '-')
const isLocked = (u: UserDto) => !!u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now()

export default function Users() {
  const [tab, setTab] = useState('users')
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [rolesKey, setRolesKey] = useState(0)
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState('')

  useEffect(() => {
    let alive = true
    setRolesLoading(true)
    rolesApi
      .list()
      .then((r) => { if (alive) { setRoles(r); setRolesError('') } })
      .catch((e) => { if (alive) setRolesError(errMsg(e)) })
      .finally(() => { if (alive) setRolesLoading(false) })
    return () => { alive = false }
  }, [rolesKey])

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="min-h-[44px]">{L.tabUsers}</TabsTrigger>
          <TabsTrigger value="roles" className="min-h-[44px]">{L.tabRoles}</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab roles={roles} /></TabsContent>
        <TabsContent value="roles">
          <RolesTab roles={roles} loading={rolesLoading} error={rolesError} onChanged={() => setRolesKey((k) => k + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------

function UsersTab({ roles }: { roles: RoleDto[] }) {
  const [items, setItems] = useState<UserDto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [roleF, setRoleF] = useState('')
  const [actF, setActF] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [busy, setBusy] = useState(false)

  const [dlg, setDlg] = useState<UserDto | 'new' | null>(null)
  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPwd, setFPwd] = useState('')
  const [fRole, setFRole] = useState('')
  const [fActive, setFActive] = useState(true)
  const [fBranch, setFBranch] = useState('')
  const [branches, setBranches] = useState<BranchDto[]>([])

  useEffect(() => {
    branchesApi.list().then(setBranches).catch(() => { /* not allowed: the list stays empty */ })
  }, [])
  const [resetFor, setResetFor] = useState<UserDto | null>(null)
  const [newPwd, setNewPwd] = useState('')

  useEffect(() => {
    const id = setTimeout(() => { setSearch(q.trim()); setPage(1) }, 350)
    return () => clearTimeout(id)
  }, [q])

  useEffect(() => {
    let alive = true
    setLoading(true)
    usersApi
      .list({
        search: search || undefined, roleId: roleF ? Number(roleF) : undefined,
        isActive: actF === '' ? undefined : actF === '1', page, pageSize: PAGE_SIZE,
      })
      .then((r) => { if (alive) { setItems(r.items); setTotal(r.totalCount ?? r.total ?? r.items.length) } })
      .catch((e) => { if (alive) toast.error(errMsg(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [search, roleF, actF, page, reloadKey])

  const act = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
      after?.()
      setReloadKey((k) => k + 1)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const open = (x: UserDto | 'new') => {
    setDlg(x)
    if (x === 'new') { setFName(''); setFEmail(''); setFPwd(''); setFRole(''); setFActive(true); setFBranch('') }
    else { setFName(x.fullName); setFEmail(x.email); setFPwd(''); setFRole(String(x.roleId)); setFActive(x.isActive); setFBranch(x.branchId ? String(x.branchId) : '') }
  }
  const isAdminRole = roles.find((r) => String(r.id) === fRole)?.name === 'Admin'
  const branchName = (id: number | null) => (id ? (branches.find((b) => b.id === id)?.name ?? String(id)) : LB.all)
  const valid = fName.trim() && fEmail.trim() && fRole && (dlg !== 'new' || fPwd) && (isAdminRole || fBranch)
  const save = () =>
    act(
      () =>
        dlg === 'new' || dlg === null
          ? usersApi.create({ fullName: fName.trim(), email: fEmail.trim(), password: fPwd, roleId: Number(fRole), branchId: isAdminRole ? null : Number(fBranch) })
          : usersApi.update(dlg.id, { fullName: fName.trim(), email: fEmail.trim(), roleId: Number(fRole), isActive: fActive, branchId: isAdminRole ? null : Number(fBranch) }),
      L.saved, () => setDlg(null),
    )
  const toggleActive = (u: UserDto) =>
    act(() => usersApi.update(u.id, { fullName: u.fullName, email: u.email, roleId: u.roleId, isActive: !u.isActive }), L.saved)

  return (
    <div>
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input className={field} placeholder={L.search} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={field} value={roleF} onChange={(e) => { setRoleF(e.target.value); setPage(1) }}>
          <option value="">{L.allRoles}</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select className={field} value={actF} onChange={(e) => { setActF(e.target.value); setPage(1) }}>
          <option value="">{L.allStatus}</option>
          <option value="1">{L.active}</option>
          <option value="0">{L.inactive}</option>
        </select>
        <Button className="min-h-[40px]" onClick={() => open('new')}><Plus className="me-2 h-4 w-4" />{L.addUser}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{L.empty}</div>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{L.name}</th><th className={th}>{L.email}</th><th className={th}>{L.role}</th><th className={th}>{LB.branch}</th>
                <th className={th}>{L.status}</th><th className={th}>{L.lastLogin}</th><th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td className={td}><b>{u.fullName}</b></td>
                  <td className={td}><span className="tnum text-muted-foreground" dir="ltr">{u.email}</span></td>
                  <td className={td}><Pill tone="teal">{u.roleName}</Pill></td>
                  <td className={td}>{branchName(u.branchId)}</td>
                  <td className={td}>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" checked={u.isActive} disabled={busy} onChange={() => toggleActive(u)} />
                      <span className="text-xs text-muted-foreground">{u.isActive ? L.active : L.inactive}</span>
                    </label>
                    {isLocked(u) && <Pill tone="red" className="mt-1">{L.locked}</Pill>}
                  </td>
                  <td className={td}><span className="tnum text-xs text-muted-foreground">{fmtDt(u.lastLoginAt)}</span></td>
                  <td className={td}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9" title={L.editUser} onClick={() => open(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" title={L.resetPwd} onClick={() => { setResetFor(u); setNewPwd('') }}><KeyRound className="h-4 w-4" /></Button>
                      {isLocked(u) && (
                        <Button variant="ghost" size="icon" className="h-9 w-9" title={L.unlock} disabled={busy} onClick={() => act(() => usersApi.unlock(u.id), L.unlocked)}><Unlock className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 text-center text-xs text-muted-foreground">{L.noDeleteUser}</div>
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{L.prev}</Button>
        <span className="tnum">{L.page} {page} / {pagesOf(total)}</span>
        <Button variant="outline" size="sm" disabled={page >= pagesOf(total)} onClick={() => setPage(page + 1)}>{L.next}</Button>
      </div>

      {/* add / edit */}
      <Dialog open={dlg !== null} onOpenChange={(o) => { if (!o) setDlg(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dlg === 'new' ? L.addUser : L.editUser}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <input className={field} placeholder={L.name} value={fName} onChange={(e) => setFName(e.target.value)} />
            <input type="email" dir="ltr" className={field} placeholder={L.email} value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
            {dlg === 'new' && <input type="password" dir="ltr" className={field} placeholder={L.password} value={fPwd} onChange={(e) => setFPwd(e.target.value)} />}
            <select className={field} value={fRole} onChange={(e) => setFRole(e.target.value)}>
              <option value="">{L.pickRole}</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {!isAdminRole && (
              <select className={field} value={fBranch} onChange={(e) => setFBranch(e.target.value)}>
                <option value="">{LB.pickBranch}</option>
                {branches.filter((b) => b.isActive || String(b.id) === fBranch).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            {isAdminRole && <div className="text-xs text-muted-foreground">{LB.adminNoBranch}</div>}
            {dlg !== 'new' && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={fActive} onChange={(e) => setFActive(e.target.checked)} />{L.active}
              </label>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDlg(null)}>{L.back}</Button>
            <Button disabled={busy || !valid} onClick={save}>{busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* reset password */}
      <Dialog open={!!resetFor} onOpenChange={(o) => { if (!o) setResetFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.resetPwd}</DialogTitle></DialogHeader>
          {resetFor && <div className="text-sm"><b>{resetFor.fullName}</b><div className="text-xs text-muted-foreground">{L.resetNote}</div></div>}
          <input type="password" dir="ltr" className={field} placeholder={L.newPwd} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetFor(null)}>{L.back}</Button>
            <Button disabled={busy || !newPwd} onClick={() => resetFor && act(() => usersApi.resetPassword(resetFor.id, newPwd), L.pwdDone, () => setResetFor(null))}>{L.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------

function RolesTab({ roles, loading, error, onChanged }: { roles: RoleDto[]; loading: boolean; error: string; onChanged: () => void }) {
  const [groups, setGroups] = useState<PermissionGroupDto[]>([])
  const [busy, setBusy] = useState(false)
  const [dlg, setDlg] = useState<RoleDto | 'new' | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const [delFor, setDelFor] = useState<RoleDto | null>(null)

  useEffect(() => {
    rolesApi.permissions().then(setGroups).catch(() => { /* shown when opening */ })
  }, [])

  const editing = dlg !== null && dlg !== 'new' ? dlg : null
  const isAdmin = editing?.name === 'Admin'
  const nameLocked = !!editing?.isSystem

  const open = (r: RoleDto | 'new') => {
    setDlg(r)
    if (r === 'new') { setName(''); setDesc(''); setSel([]) }
    else { setName(r.name); setDesc(r.description ?? ''); setSel(r.permissions) }
  }
  const toggle = (p: string) => setSel((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]))

  const act = async (fn: () => Promise<unknown>, ok: string, after: () => void) => {
    setBusy(true)
    try { await fn(); toast.success(ok); after(); onChanged() } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }
  const save = () => {
    const body = { name: name.trim(), description: desc.trim() || null, permissionNames: sel }
    return act(() => (editing ? rolesApi.update(editing.id, body) : rolesApi.create(body)), L.saved, () => setDlg(null))
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  if (error) return <div className="py-8 text-center text-sm text-destructive">{error}</div>

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button className="min-h-[40px]" onClick={() => open('new')}><Plus className="me-2 h-4 w-4" />{L.addRole}</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 font-extrabold"><ShieldCheck className="h-4 w-4 text-primary" />{r.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.permissions.length} {L.perms}</div>
                {r.description && <div className="mt-1 text-xs text-muted-foreground">{r.description}</div>}
              </div>
              {r.isSystem && <Pill tone="purple">{L.system}</Pill>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {r.permissions.slice(0, 5).map((p) => (
                <span key={p} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground" dir="ltr">{p}</span>
              ))}
              {r.permissions.length > 5 && <span className="text-[10px] text-muted-foreground">+{r.permissions.length - 5}</span>}
            </div>
            <div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => open(r)}>{r.name === 'Admin' ? L.view : L.edit}</Button>
              {!r.isSystem && (
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setDelFor(r)}><Trash2 className="h-4 w-4" /></Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dlg !== null} onOpenChange={(o) => { if (!o) setDlg(null) }}>
        <DialogContent className="scrollbar-thin max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{dlg === 'new' ? L.addRole : isAdmin ? L.viewRole : L.editRole}</DialogTitle></DialogHeader>
          {isAdmin && <div className="rounded-lg bg-muted p-3 text-xs font-bold text-muted-foreground">{L.adminLocked}</div>}
          {!isAdmin && nameLocked && <div className="rounded-lg bg-muted p-3 text-xs font-bold text-muted-foreground">{L.sysName}</div>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input className={field} placeholder={L.roleName} value={name} disabled={isAdmin || nameLocked} onChange={(e) => setName(e.target.value)} />
            <input className={field} placeholder={L.roleDesc} value={desc} disabled={isAdmin} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.module} className="rounded-xl border p-3">
                <div className="mb-2 text-sm font-extrabold" dir="ltr">{g.module}</div>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {g.permissions.map((p) => (
                    <label key={p} className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-md px-2 hover:bg-muted/60">
                      <input type="checkbox" className="h-4 w-4" checked={sel.includes(p)} disabled={isAdmin} onChange={() => toggle(p)} />
                      <span className="text-sm" dir="ltr">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {!isAdmin && sel.length === 0 && <div className="text-xs text-muted-foreground">{L.needPerm}</div>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDlg(null)}>{L.back}</Button>
            {!isAdmin && <Button disabled={busy || !name.trim() || sel.length === 0} onClick={save}>{busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{L.save}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!delFor} onOpenChange={(o) => { if (!o) setDelFor(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L.delRole}</DialogTitle></DialogHeader>
          <div className="text-sm">{L.delConfirm} <b>{delFor?.name}</b></div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDelFor(null)}>{L.back}</Button>
            <Button variant="destructive" disabled={busy} onClick={() => delFor && act(() => rolesApi.remove(delFor.id), L.deleted, () => setDelFor(null))}>{L.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}