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
// carries the wordmark and the drawer trigger, nothing else — never a
// second place to put nav content.
export function AppShell() {
  const { user } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  if (!user) return null

  return (
    <div className="flex min-h-svh">
      {/* `flex-col`, not `flex`: as a row container this stretched nothing
          and let SidebarNav collapse to its content width (~133px inside a
          256px rail), which is what cut the nav's hover and focus states
          short. `sticky top-0 h-svh` pins it to the viewport — sized off
          the page it grew with the content and carried Log out off the
          bottom of a long screen. */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:flex">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/85 px-3 py-2 backdrop-blur-sm md:hidden">
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
          <span className="font-heading text-sm font-semibold tracking-tight">Qantonic</span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
