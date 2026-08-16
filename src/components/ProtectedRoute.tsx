import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import type { AdminRole } from '@/lib/api'

// `allow`, when given, gates the whole subtree to those roles — used for
// owner-only pages (Config, Staff). Server-side authorization is what
// actually matters (AdminInterfaceLayer.authorize on every request); this
// just keeps a staff/platform_operator account from landing on a page
// that's just going to 403 on every call.
export function ProtectedRoute({ allow }: { allow?: AdminRole[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}
