import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, type AdminRole, type SignupRequest } from '@/lib/api'
import { decodeToken, isExpired } from '@/lib/jwt'

const STORAGE_KEY = 'admin_token'

interface AuthedUser {
  token: string
  email: string
  role: AdminRole
  businessId: string | null
}

interface AuthContextValue {
  user: AuthedUser | null
  login: (email: string, password: string) => Promise<void>
  signup: (request: SignupRequest) => Promise<void>
  logout: () => void
}

function storeToken(token: string): AuthedUser {
  const claims = decodeToken(token)
  localStorage.setItem(STORAGE_KEY, token)
  return { token, email: claims.email, role: claims.role, businessId: claims.business_id }
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): AuthedUser | null {
  const token = localStorage.getItem(STORAGE_KEY)
  if (!token) return null
  try {
    const claims = decodeToken(token)
    if (isExpired(claims)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { token, email: claims.email, role: claims.role, businessId: claims.business_id }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthedUser | null>(loadStoredUser)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email, password) {
        const { access_token: token } = await api.login(email, password)
        setUser(storeToken(token))
      },
      async signup(request) {
        const { access_token: token } = await api.signup(request)
        setUser(storeToken(token))
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { ApiError }
