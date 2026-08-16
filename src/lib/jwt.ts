import type { AdminRole } from '@/lib/api'

export interface AdminTokenClaims {
  email: string
  role: AdminRole
  business_id: string | null
  exp: number
}

// Client-side decode only, for UI routing (which nav items to show, which
// business scope to call). Never trust this for anything security-relevant
// — the backend re-verifies the signature on every request through
// AdminInterfaceLayer.authorize().
export function decodeToken(token: string): AdminTokenClaims {
  const payload = token.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}

export function isExpired(claims: AdminTokenClaims): boolean {
  return Date.now() / 1000 >= claims.exp
}
