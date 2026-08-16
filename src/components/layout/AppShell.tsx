import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { dataRowKindFor } from '@/lib/business'
import { cn } from '@/lib/utils'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground',
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  if (!user) return null

  const dataRowKind = dataRowKindFor(user.businessId)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Business Admin</span>
          <nav className="flex items-center gap-1">
            {user.role === 'owner' && (
              <NavLink to="/config" className={navLinkClass}>
                Config
              </NavLink>
            )}
            {dataRowKind === 'menu-items' && (
              <NavLink to="/menu-items" className={navLinkClass}>
                Menu Items
              </NavLink>
            )}
            {dataRowKind === 'rooms' && (
              <NavLink to="/rooms" className={navLinkClass}>
                Rooms
              </NavLink>
            )}
            {user.role === 'owner' && (
              <NavLink to="/staff" className={navLinkClass}>
                Staff
              </NavLink>
            )}
            {(user.role === 'owner' || user.role === 'platform_operator') && (
              <NavLink to="/audit-log" className={navLinkClass}>
                Audit Log
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {user.email} · {user.role}
            {user.businessId ? ` · ${user.businessId}` : ''}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
