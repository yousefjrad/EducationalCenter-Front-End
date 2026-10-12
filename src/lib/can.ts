import { useAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export function useCan(perm: Parameters<typeof hasPermission>[0]): boolean {
  useAuth()
  return hasPermission(perm)
}
