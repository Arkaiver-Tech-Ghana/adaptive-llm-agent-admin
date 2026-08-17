import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BotIcon, DatabaseIcon, LogOutIcon, ScrollTextIcon, type LucideIcon } from 'lucide-react'
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
import type { AdminRole } from '@/lib/api'
import { cn } from '@/lib/utils'

// "Config" is what the backend calls it; an owner reading the rail wants to
// know which of their things each screen edits. Icons carry the same split
// so the rail is scannable without reading.
const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; roles: AdminRole[] }[] = [
  { to: '/config', label: 'Agent', icon: BotIcon, roles: ['owner'] },
  { to: '/database', label: 'Database', icon: DatabaseIcon, roles: ['owner'] },
  { to: '/audit-log', label: 'Audit log', icon: ScrollTextIcon, roles: ['owner', 'platform_operator'] },
]

const ROLE_LABEL: Record<AdminRole, string> = {
  owner: 'Owner',
  platform_operator: 'Platform operator',
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    // `w-full` so the hit area, hover fill and focus ring span the rail
    // rather than the label's own width, and an explicit focus-visible
    // ring: the base `* { outline-ring/50 }` in index.css only sets the
    // outline *colour*, so these links had no visible focus state at all.
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    isActive
      ? 'bg-primary/8 text-primary'
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
    <div className="flex h-full w-full min-w-0 flex-col gap-6">
      <span className="flex items-center gap-2 px-1 pt-0.5">
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary font-heading text-xs font-semibold text-primary-foreground"
        >
          Q
        </span>
        <span className="font-heading text-base font-semibold tracking-tight">Qantonic</span>
      </span>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.filter((item) => item.roles.includes(user.role)).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass} onClick={onNavigate}>
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3 border-t border-sidebar-border pt-4">
        <div className="flex min-w-0 items-center gap-2.5 px-1">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase"
          >
            {user.email.slice(0, 2)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium" title={user.email}>
              {user.email}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {ROLE_LABEL[user.role]}
              {user.businessId ? ` · ${user.businessId}` : ''}
            </span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setConfirmingLogout(true)}
        >
          <LogOutIcon /> Log out
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
