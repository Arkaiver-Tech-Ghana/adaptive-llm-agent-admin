import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { useAuth } from '@/lib/auth'

// Vertical sidebar, always — desktop gets a fixed sidebar, mobile gets a
// Sheet drawer holding the exact same SidebarNav content. Nav items, user
// info, and logout live in that sidebar in both cases; the mobile top bar
// is a bare hamburger trigger, nothing else — never a second place to put
// nav content.
export function AppShell() {
  const { user } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  if (!user) return null

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:flex">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b px-4 py-2.5 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
