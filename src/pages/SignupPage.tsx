import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'

// Derives a URL/filesystem-safe slug from a display name — mirrors the
// backend's business_id validation (business_config/provisioning.py):
// lowercase letters, digits, and hyphens only.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function SignupPage() {
  const { user, signup } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [businessIdEdited, setBusinessIdEdited] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  function onDisplayNameChange(value: string) {
    setDisplayName(value)
    if (!businessIdEdited) setBusinessId(slugify(value))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signup({
        business_id: businessId,
        display_name: displayName,
        owner_email: email,
        owner_password: password,
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your Business</CardTitle>
          <CardDescription>Sign up to manage your own AI agent.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display_name">Business name</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => onDisplayNameChange(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business_id">Business ID</Label>
              <Input
                id="business_id"
                value={businessId}
                onChange={(e) => {
                  setBusinessIdEdited(true)
                  setBusinessId(slugify(e.target.value))
                }}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Lowercase letters, digits, and hyphens only"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Your email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="mt-2">
              {busy ? 'Creating…' : 'Create Business'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-foreground underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
