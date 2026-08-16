import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

// Sends a freshly-logged-in user to their real landing page: owner ->
// config, platform_operator -> audit log (their only real page).
export function HomePage() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  if (user.role === 'owner') return <Navigate to="/config" replace />
  return <Navigate to="/audit-log" replace />
}
