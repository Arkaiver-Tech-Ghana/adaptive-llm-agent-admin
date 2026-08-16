import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  )
}

// The full sidebar content — nav links plus the user-info/logout footer —
// shared by both the desktop-fixed sidebar and the mobile Sheet drawer
// (AppShell.tsx) so there's exactly one place that decides what's in it.
// Nav items, and the logout button, live here and only here: never in a
// top bar, on any breakpoint.
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  if (!user) return null

  return (
    <div className="flex h-full flex-col gap-6">
      <span className="font-heading text-lg font-semibold">Qantonic</span>

      <nav className="flex flex-1 flex-col gap-1">
        {user.role === 'owner' && (
          <NavLink to="/config" className={navLinkClass} onClick={onNavigate}>
            Config
          </NavLink>
        )}
        {user.role === 'owner' && (
          <NavLink to="/database" className={navLinkClass} onClick={onNavigate}>
            Database
          </NavLink>
        )}
        {(user.role === 'owner' || user.role === 'platform_operator') && (
          <NavLink to="/audit-log" className={navLinkClass} onClick={onNavigate}>
            Audit Log
          </NavLink>
        )}
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border pt-4">
        <span className="truncate text-xs text-sidebar-foreground/70">
          {user.email}
          {user.businessId ? ` · ${user.businessId}` : ''}
        </span>
        <Button variant="outline" size="sm" onClick={() => setConfirmingLogout(true)}>
          Log out
        </Button>
      </div>

      <Dialog open={confirmingLogout} onOpenChange={setConfirmingLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>You'll need to sign in again to get back in.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingLogout(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmingLogout(false)
                onNavigate?.()
                logout()
              }}
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
