import { useMemo, useState } from 'react'
import { CalendarDays, MapPin, Users2 } from 'lucide-react'
import { useStore } from '@/store/AppStore'
import { useI18n } from '@/lib/i18n'
import { PageHeader, Pill } from '@/components/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const DAYS = [0, 1, 2, 3, 4, 5, 6]

export default function Schedule() {
  const { t } = useI18n()
  const { state } = useStore()
  const [tab, setTab] = useState('rooms')

  const openSections = useMemo(() => state.sections.filter((s) => s.status === 'open'), [state.sections])

  const Grid = ({ entities, keyName, icon }: { entities: { id: number; name: string }[]; keyName: 'roomId' | 'trainerId'; icon: React.ReactNode }) => (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr>
            <th className="sticky start-0 z-10 w-[120px] border-b bg-muted/70 px-3 py-2.5 text-start text-xs font-bold text-muted-foreground"></th>
            {DAYS.map((d) => (
              <th key={d} className="border-b border-s bg-muted/70 px-2 py-2.5 text-center text-xs font-bold text-muted-foreground">
                {t(`daysShort.${d}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entities.map((ent) => (
            <tr key={ent.id} className="border-b last:border-0">
              <td className="sticky start-0 z-10 bg-card px-3 py-2 align-top">
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  <span className="text-primary">{icon}</span>
                  <span className="truncate">{ent.name}</span>
                </div>
              </td>
              {DAYS.map((d) => {
                const items = openSections.filter((s) => s[keyName] === ent.id && s.schedule.some((sl) => sl.day === d))
                return (
                  <td key={d} className="border-s px-1.5 py-1.5 align-top">
                    <div className="flex min-h-[64px] flex-col gap-1">
                      {items.map((s) =>
                        s.schedule.filter((sl) => sl.day === d).map((sl, i) => {
                          const trainer = state.trainers.find((x) => x.id === s.trainerId)
                          const room = state.rooms.find((r) => r.id === s.roomId)
                          return (
                            <div
                              key={`${s.id}-${i}`}
                              className={cn(
                                'rounded-md border-s-4 border-primary bg-primary/10 px-1.5 py-1',
                                'text-[10px] leading-tight',
                              )}
                              title={`${s.title} — ${sl.start}–${sl.end}`}
                            >
                              <div className="tnum font-extrabold text-primary">{sl.start}–{sl.end}</div>
                              <div className="truncate font-bold">{s.title}</div>
                              <div className="truncate text-muted-foreground">
                                {keyName === 'roomId' ? trainer?.name : room?.name}
                              </div>
                            </div>
                          )
                        }),
                      )}
                      {items.length === 0 && <span className="px-1 text-[10px] text-muted-foreground/50">{t('schedule.free')}</span>}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // busy-hours heat summary per day
  const dayLoad = DAYS.map((d) => ({
    day: d,
    count: openSections.reduce((a, s) => a + s.schedule.filter((sl) => sl.day === d).length, 0),
  }))
  const maxLoad = Math.max(1, ...dayLoad.map((x) => x.count))

  return (
    <div>
      <PageHeader title={t('schedule.title')} subtitle={t('schedule.subtitle')} />

      {/* week density strip */}
      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {dayLoad.map(({ day, count }) => (
          <div key={day} className="rounded-lg border bg-card p-2 text-center">
            <div className="text-[11px] font-bold text-muted-foreground">{t(`daysShort.${day}`)}</div>
            <div className="mx-auto mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxLoad) * 100}%` }} />
            </div>
            <div className="tnum mt-1 text-xs font-extrabold">{count}</div>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="rooms" className="min-h-[44px] gap-2"><MapPin className="h-4 w-4" />{t('schedule.byRoom')}</TabsTrigger>
          <TabsTrigger value="trainers" className="min-h-[44px] gap-2"><Users2 className="h-4 w-4" />{t('schedule.byTrainer')}</TabsTrigger>
        </TabsList>
        <TabsContent value="rooms">
          <Grid entities={state.rooms.filter((r) => r.active)} keyName="roomId" icon={<MapPin className="h-3.5 w-3.5" />} />
        </TabsContent>
        <TabsContent value="trainers">
          <Grid entities={state.trainers.filter((x) => x.active)} keyName="trainerId" icon={<Users2 className="h-3.5 w-3.5" />} />
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Pill tone="teal"><CalendarDays className="h-3 w-3" />{openSections.length}</Pill>
        {t('sections.subtitle')}
      </div>
    </div>
  )
}
