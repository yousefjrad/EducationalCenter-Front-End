import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Inbox } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { fmtSYP } from '@/lib/format'

// ---------- Page header ----------
export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ---------- KPI stat card ----------
export function StatCard({
  label, value, hint, icon, tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  icon: ReactNode
  tone?: 'default' | 'danger' | 'success' | 'warning'
}) {
  const tones = {
    default: 'bg-primary/10 text-primary',
    danger: 'bg-destructive/10 text-destructive',
    success: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
    warning: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
  }
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm text-muted-foreground">{label}</div>
          <div className="tnum truncate text-xl font-extrabold">{value}</div>
          {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- status pill ----------
export type PillTone = 'green' | 'red' | 'amber' | 'blue' | 'gray' | 'teal' | 'purple'
const pillClasses: Record<PillTone, string> = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  blue: 'bg-sky-100 text-sky-800 border-sky-200',
  gray: 'bg-slate-100 text-slate-600 border-slate-200',
  teal: 'bg-teal-100 text-teal-800 border-teal-200',
  purple: 'bg-violet-100 text-violet-800 border-violet-200',
}
export function Pill({ tone = 'gray', children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold', pillClasses[tone], className)}>
      {children}
    </span>
  )
}

// ---------- money ----------
export function Money({ amount, className }: { amount: number; className?: string }) {
  const { lang } = useI18n()
  return <span className={cn('tnum font-bold', className)}>{fmtSYP(amount, lang)}</span>
}

// ---------- search input ----------
export function SearchInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const { t } = useI18n()
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t('common.search')} className="min-h-[44px] ps-9" />
    </div>
  )
}

// ---------- empty state ----------
export function EmptyState({ message, icon, action }: { message: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">
      <div className="text-muted-foreground">{icon ?? <Inbox className="h-10 w-10" strokeWidth={1.2} />}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}

// ---------- table wrapper for horizontal scroll on mobile ----------
export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">{children}</div>
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('whitespace-nowrap border-b bg-muted/60 px-4 py-3 text-start text-xs font-bold text-muted-foreground', className)}>{children}</th>
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-sm align-middle', className)}>{children}</td>
}

// ---------- labeled field ----------
export function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  )
}

// ---------- progress bar ----------
export function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-destructive' : pct >= 80 ? 'bg-[hsl(var(--warning))]' : 'bg-primary')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Card, CardContent, CardHeader, CardTitle, Badge }
