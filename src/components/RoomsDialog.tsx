import { useCallback, useEffect, useState } from 'react'
import { Pencil, Power } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { ApiError } from '@/services/api'
import { roomsApi, type RoomDto } from '@/services/rooms'
import { Field, Pill } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const errText = (e: unknown) => (e instanceof ApiError ? e.message : String(e))

export default function RoomsDialog({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  const { t, lang } = useI18n()
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const [rooms, setRooms] = useState<RoomDto[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<RoomDto | null>(null)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('20')
  const [location, setLocation] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    roomsApi.list({ pageSize: 100 })
      .then((r) => setRooms(r.items))
      .catch((e) => toast.error(errText(e)))
      .finally(() => setLoading(false))
  }, [])

  const reset = () => { setEditing(null); setName(''); setCapacity('20'); setLocation('') }

  useEffect(() => { if (open) load(); else reset() }, [open, load])

  const startEdit = (r: RoomDto) => {
    setEditing(r)
    setName(r.name)
    setCapacity(String(r.capacity))
    setLocation(r.location ?? '')
  }

  const save = async () => {
    const cap = Number(capacity)
    if (!name.trim()) { toast.error(t('common.required')); return }
    if (!Number.isInteger(cap) || cap < 1 || cap > 1000) {
      toast.error(L('السعة بين 1 و 1000', 'Capacity must be between 1 and 1000'))
      return
    }
    setSaving(true)
    try {
      const body = { name: name.trim(), capacity: cap, description: editing?.description ?? null, location: location.trim() || null }
      if (editing) await roomsApi.update(editing.id, { ...body, isActive: editing.isActive, rowVersion: editing.rowVersion })
      else await roomsApi.create(body)
      toast.success(t('common.saved'))
      reset()
      load()
      onChanged()
    } catch (e) {
      toast.error(errText(e))
      if (String(errText(e)).includes('changed by another user')) { reset(); load(); onChanged() }
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (r: RoomDto) => {
    try {
      await roomsApi.update(r.id, { name: r.name, capacity: r.capacity, description: r.description, location: r.location, isActive: !r.isActive, rowVersion: r.rowVersion })
      load()
      onChanged()
    } catch (e) {
      toast.error(errText(e))
      load()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="scrollbar-thin max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{L('إدارة القاعات', 'Manage rooms')}</DialogTitle></DialogHeader>

        <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-3">
          <Field label={t('common.name')} required>
            <Input className="min-h-[44px]" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={L('السعة', 'Capacity')} required>
            <Input type="number" min={1} dir="ltr" className="min-h-[44px]" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </Field>
          <Field label={L('الموقع', 'Location')}>
            <Input className="min-h-[44px]" value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <div className="flex gap-2 sm:col-span-3">
            <Button className="min-h-[44px]" onClick={save} disabled={saving}>
              {editing ? t('common.save') : L('إضافة قاعة', 'Add room')}
            </Button>
            {editing && <Button variant="outline" className="min-h-[44px]" onClick={reset}>{t('common.cancel')}</Button>}
          </div>
        </div>

        <div className="mt-2 space-y-2">
          {loading && rooms.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">...</div>}
          {rooms.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <div className="min-w-0">
                <div className="font-bold">{r.name} <span className="tnum text-xs text-muted-foreground">({r.capacity})</span></div>
                <div className="text-xs text-muted-foreground">{r.location ?? ''}</div>
              </div>
              <div className="flex items-center gap-1">
                {!r.isActive && <Pill tone="gray">{t('common.inactive')}</Pill>}
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => startEdit(r)}><Pencil className="h-4 w-4" /></Button>
                <Button
                  variant="ghost" size="icon"
                  className={r.isActive ? 'h-9 w-9 text-destructive' : 'h-9 w-9 text-[hsl(var(--success))]'}
                  onClick={() => toggle(r)}
                ><Power className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {!loading && rooms.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">{L('لا توجد قاعات بعد', 'No rooms yet')}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}