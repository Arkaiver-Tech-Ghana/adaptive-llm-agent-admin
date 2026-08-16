import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

// Public "/" — a signed-in user never sees this, they're bounced straight
// to their real page (owner -> config, platform_operator -> audit log),
// same routing HomePage used to do inline. A signed-out visitor gets an
// actual landing page instead of an immediate redirect to a bare login
// form.
export function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === 'owner' ? '/config' : '/audit-log'} replace />

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="flex flex-col gap-3">
        <span className="font-heading text-3xl font-semibold">Qantonic</span>
        <p className="max-w-md text-muted-foreground">
          Self-serve admin for your AI business agent — configure its persona and
          behavior, manage your own data tables, and control what it's allowed to do.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/signup">Create a Business</Link>
        </Button>
      </div>
    </div>
  )
}
