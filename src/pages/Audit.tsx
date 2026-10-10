import { useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useStore } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import { fmtDateTime } from '@/lib/format'
import { PageHeader, SearchInput, EmptyState, Pill, TableScroll, Th, Td } from '@/components/shared'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const actionTone: Record<string, 'green' | 'blue' | 'red'> = { create: 'green', update: 'blue', void: 'red' }

export default function Audit() {
  const { t, lang } = useI18n()
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const list = useMemo(
    () =>
      [...state.auditLog]
        .filter((a) => actionFilter === 'all' || a.action === actionFilter)
        .filter((a) => {
          if (!q.trim()) return true
          const user = state.users.find((u) => u.id === a.userId)
          return a.details.includes(q.trim()) || (user?.name ?? '').includes(q.trim())
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.auditLog, state.users, q, actionFilter],
  )

  return (
    <div>
      <PageHeader title={t('audit.title')} subtitle={t('audit.subtitle')} />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={q} onChange={setQ} className="w-full max-w-sm" />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="min-h-[44px] w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="create">{t('audit.action.create')}</SelectItem>
            <SelectItem value="update">{t('audit.action.update')}</SelectItem>
            <SelectItem value="void">{t('audit.action.void')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <EmptyState message={t('audit.empty')} icon={<ScrollText className="h-10 w-10" strokeWidth={1.2} />} />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[720px]">
            <thead>
              <tr><Th>{t('common.date')}</Th><Th>{t('audit.user')}</Th><Th>{t('audit.action')}</Th><Th>{t('audit.entity')}</Th><Th>{t('common.details')}</Th></tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const user = state.users.find((u) => u.id === a.userId)
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                    <Td><span className="tnum whitespace-nowrap text-muted-foreground">{fmtDateTime(a.date)}</span></Td>
                    <Td className="font-bold">{user?.name ?? '—'}</Td>
                    <Td><Pill tone={actionTone[a.action]}>{t(`audit.action.${a.action}`)}</Pill></Td>
                    <Td><span className="text-xs text-muted-foreground" dir="ltr">{a.entity} #{a.entityId}</span></Td>
                    <Td className="max-w-[340px]"><span className="text-sm">{lang === 'ar' ? a.details : a.details}</span></Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  )
}
