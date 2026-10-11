import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import {
  LayoutDashboard, ClipboardList, BookOpen, Layers, CalendarDays, GraduationCap, Users2,
  Wallet, ClipboardCheck, Award, ReceiptText, BarChart3, ShieldCheck,
  ScrollText, Settings as SettingsIcon, Bell, LogOut, Menu, Languages, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useStore, useCurrentUser, can } from '@/store/AppStore'
import { api } from '@/services/api'
import { useAuth } from '@/lib/auth'
import type { PermissionKey } from '@/types'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { fmtDate, initials } from '@/lib/format'

interface NavItem {
  to: string
  labelKey: string
  icon: React.ElementType
  perm: PermissionKey
}

interface NavGroup {
  key: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    key: 'nav.group.main',
    items: [{ to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, perm: 'Dashboard.View' }],
  },
  {
    key: 'nav.group.academic',
    items: [
      { to: '/courses', labelKey: 'nav.courses', icon: BookOpen, perm: 'Courses.View' },
      { to: '/sections', labelKey: 'nav.sections', icon: Layers, perm: 'Sections.View' },
      { to: '/schedule', labelKey: 'nav.schedule', icon: CalendarDays, perm: 'Sections.View' },
      { to: '/students', labelKey: 'nav.students', icon: GraduationCap, perm: 'Students.View' },
      { to: '/enrollments', labelKey: 'nav.enrollments', icon: ClipboardList, perm: 'Enrollments.Manage' },
      { to: '/trainers', labelKey: 'nav.trainers', icon: Users2, perm: 'Trainers.View' },
      { to: '/attendance', labelKey: 'nav.attendance', icon: ClipboardCheck, perm: 'Attendance.Manage' },
      { to: '/certificates', labelKey: 'nav.certificates', icon: Award, perm: 'Grades.Manage' },
    ],
  },
  {
    key: 'nav.group.finance',
    items: [
      { to: '/payments', labelKey: 'nav.payments', icon: Wallet, perm: 'Payments.View' },
      { to: '/expenses', labelKey: 'nav.expenses', icon: ReceiptText, perm: 'Expenses.Manage' },
      { to: '/reports', labelKey: 'nav.reports', icon: BarChart3, perm: 'Reports.View' },
    ],
  },
  {
    key: 'nav.group.system',
    items: [
      { to: '/users', labelKey: 'nav.users', icon: ShieldCheck, perm: 'Users.Manage' },
      { to: '/audit', labelKey: 'nav.audit', icon: ScrollText, perm: 'Audit.View' },
      { to: '/settings', labelKey: 'nav.settings', icon: SettingsIcon, perm: 'Settings.Manage' },
    ],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t, lang } = useI18n()
  const { state } = useStore()
  const uid = state.currentUserId

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
      <div className="flex items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-xl font-black text-white shadow-lg">
          {state.certTemplate.logoText}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-extrabold text-white">{t('app.name')}</div>
          <div className="truncate text-[11px] text-[hsl(var(--sidebar-foreground))]/70">{t('app.tagline')}</div>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const items = group.items.filter((i) => can(state, uid, i.perm))
          if (items.length === 0) return null
          return (
            <div key={group.key}>
              <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--sidebar-foreground))]/50">
                {t(group.key)}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors',
                          isActive
                            ? 'bg-[hsl(var(--sidebar-accent))] text-white shadow-inner'
                            : 'text-[hsl(var(--sidebar-foreground))]/80 hover:bg-[hsl(var(--sidebar-accent))]/60 hover:text-white',
                        )
                      }
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-[hsl(var(--sidebar-border))] px-5 py-3 text-[11px] text-[hsl(var(--sidebar-foreground))]/60">
        {state.settings.centerName} · {lang === 'ar' ? 'الإصدار 1.0' : 'v1.0'}
      </div>
    </div>
  )
}

interface BellAlerts {
  overdueInstallments: {
    count: number
    items: { installmentId: number; studentName: string; sectionName: string; installmentNumber: number; daysOverdue: number }[]
  } | null
  pendingEnrollments: {
    count: number
    items: { enrollmentId: number; studentName: string; sectionName: string; isExpired: boolean }[]
  } | null
  waitingList: {
    count: number
    items: { sectionId: number; sectionName: string; waitingCount: number; firstStudentName: string }[]
  } | null
  totalCount: number
}

interface BellItem { key: string; text: string; link: string; overdue: boolean }

const BELL_TXT = {
  ar: { inst: '\u0642\u0633\u0637', late: '\u0645\u062a\u0623\u062e\u0631', days: '\u064a\u0648\u0645', hold: '\u062d\u062c\u0632 \u0645\u0642\u0639\u062f \u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u062a\u0623\u0643\u064a\u062f', expired: '\u0627\u0646\u062a\u0647\u062a \u0645\u062f\u0629 \u0627\u0644\u062d\u062c\u0632', waiting: '\u0645\u0642\u0639\u062f \u0634\u0627\u063a\u0631 \u0648\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u062a\u0631\u0642\u064a\u0629' },
  en: { inst: 'Installment', late: 'overdue', days: 'days', hold: 'Seat hold awaiting confirmation', expired: 'Seat hold expired', waiting: 'Free seat, waiting to promote' },
}

function NotificationsBell() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [data, setData] = useState<BellAlerts | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    const load = () => {
      ;(api.get('/alerts') as Promise<BellAlerts>)
        .then((r) => { if (alive) setData(r) })
        .catch(() => { /* keep the last value */ })
    }
    load()
    const id = setInterval(load, 60000)
    return () => { alive = false; clearInterval(id) }
  }, [open])

  const items = useMemo<BellItem[]>(() => {
    const x = BELL_TXT[lang === 'ar' ? 'ar' : 'en']
    const out: BellItem[] = []
    data?.overdueInstallments?.items.forEach((a) =>
      out.push({ key: `o${a.installmentId}`, link: '/payments', overdue: true,
        text: `${a.studentName} - ${a.sectionName} - ${x.inst} #${a.installmentNumber} ${x.late} (${a.daysOverdue} ${x.days})` }))
    data?.pendingEnrollments?.items.forEach((a) =>
      out.push({ key: `p${a.enrollmentId}`, link: '/enrollments', overdue: false,
        text: `${a.studentName} - ${a.sectionName} - ${a.isExpired ? x.expired : x.hold}` }))
    data?.waitingList?.items.forEach((a) =>
      out.push({ key: `w${a.sectionId}`, link: '/enrollments', overdue: false,
        text: `${a.sectionName}: ${x.waiting} (${a.firstStudentName}, ${a.waitingCount})` }))
    return out
  }, [data, lang])

  const total = data?.totalCount ?? 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-full" aria-label={t('notif.title')}>
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span className="tnum absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-extrabold">{t('notif.title')}</span>
        </div>
        <div className="scrollbar-thin max-h-[60vh] overflow-y-auto">
          {items.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t('notif.empty')}</div>}
          {items.map((a) => (
            <button
              key={a.key}
              onClick={() => { setOpen(false); navigate(a.link) }}
              className="flex w-full items-start gap-3 border-b px-4 py-3 text-start transition-colors last:border-0 hover:bg-muted/60"
            >
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.overdue ? 'bg-destructive' : 'bg-[hsl(var(--warning))]')} />
              <span className="block min-w-0 text-sm font-bold leading-snug">{a.text}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
export default function AppLayout() {
  const { t, lang, setLang } = useI18n()
  const user = useCurrentUser()
  const { state } = useStore()
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const roleName = authUser?.roleName ?? ''

  return (
    <div className="flex min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[260px] lg:block">
        <SidebarContent />
      </aside>

      {/* mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side={lang === 'ar' ? 'right' : 'left'} className="w-[280px] border-0 p-0">
          <SheetTitle className="sr-only">{t('app.name')}</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:ms-[260px]">
        {/* topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur lg:px-6">
          <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold">{state.settings.centerName}</div>
            <div className="tnum hidden text-xs text-muted-foreground sm:block">
              {fmtDate(new Date().toISOString().slice(0, 10))}
            </div>
          </div>

          <Button
            variant="ghost" size="icon" className="h-11 w-11 rounded-full"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            aria-label="language"
            title={lang === 'ar' ? 'English' : 'العربية'}
          >
            <Languages className="h-5 w-5" />
          </Button>

          <NotificationsBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-h-[44px] items-center gap-2 rounded-full py-1 pe-2 ps-1 transition-colors hover:bg-muted">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                    {user ? initials(user.name) : '؟'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-start sm:block">
                  <span className="block max-w-[140px] truncate text-sm font-bold leading-tight">{user?.name}</span>
                  <span className="block text-xs text-muted-foreground">{roleName}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-bold">{user?.name}</div>
                <div className="text-xs font-normal text-muted-foreground" dir="ltr">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-[44px] cursor-pointer text-destructive focus:text-destructive"
                onClick={() => { void logout().finally(() => navigate('/login')) }}
              >
                <LogOut className="me-2 h-4 w-4" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { X as CloseIcon }
