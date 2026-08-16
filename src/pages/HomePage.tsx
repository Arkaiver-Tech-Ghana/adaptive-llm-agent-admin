import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { dataRowKindFor } from '@/lib/business'

// Sends a freshly-logged-in user to whichever page is actually theirs:
// owner -> config, staff -> their Business's data-row screen,
// platform_operator -> audit log (their only real page).
export function HomePage() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  if (user.role === 'owner') return <Navigate to="/config" replace />
  if (user.role === 'platform_operator') return <Navigate to="/audit-log" replace />

  const kind = dataRowKindFor(user.businessId)
  if (kind === 'menu-items') return <Navigate to="/menu-items" replace />
  if (kind === 'rooms') return <Navigate to="/rooms" replace />
  return <Navigate to="/login" replace />
}
