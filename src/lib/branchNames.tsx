import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { branchesApi, type BranchDto } from '@/services/branches'

let cache: BranchDto[] | null = null
let inflight: Promise<BranchDto[]> | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('branches:changed', () => { cache = null })
}

function load(): Promise<BranchDto[]> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = branchesApi.list()
      .then((r) => { cache = r; return r })
      .finally(() => { inflight = null })
  }
  return inflight
}

/** Branch names next to records: only for the Super Admin while viewing all branches. */
export function useBranchLabels() {
  const { isSuperAdmin, activeBranchId } = useAuth()
  const enabled = isSuperAdmin && !activeBranchId
  const [branches, setBranches] = useState<BranchDto[]>(cache ?? [])

  useEffect(() => {
    if (!enabled) return
    let alive = true
    load().then((r) => { if (alive) setBranches(r) }).catch(() => { /* names stay hidden */ })
    return () => { alive = false }
  }, [enabled])

  const label = (ids: number | number[] | null | undefined): string | null => {
    if (!enabled || ids == null) return null
    const list = Array.isArray(ids) ? ids : [ids]
    const names = list
      .map((id) => branches.find((b) => b.id === id)?.name)
      .filter((n): n is string => !!n)
    return names.length > 0 ? names.join('\u060c ') : null
  }

  return { enabled, label }
}

export function BranchBadge({ ids }: { ids: number | number[] | null | undefined }) {
  const { label } = useBranchLabels()
  const text = label(ids)
  if (!text) return null
  return (
    <span className="ms-2 inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
      <Building2 className="h-3 w-3" />
      {text}
    </span>
  )
}