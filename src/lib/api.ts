// Thin typed client for the Business Admin backend
// (adaptive-llm-agent's src/adaptive_agent/interfaces/admin/router.py).
// Every call goes through `request`, which attaches the bearer token and
// turns a non-2xx response into an `ApiError` the caller can inspect.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown; params?: Record<string, string> } = {},
): Promise<T> {
  const { method = 'GET', token, body, params } = options

  const url = new URL(`${API_BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  }

  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new ApiError(response.status, payload.detail ?? response.statusText)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export type AdminRole = 'owner' | 'staff' | 'platform_operator'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface BusinessConfig {
  business_id: string
  display_name: string
  enabled: boolean
  llm: { provider: string; model: string; max_tokens: number; effort: string | null }
  context: { source_type: string; directory: string; include_patterns: string[] }
  business_logic: {
    persona: string
    scope_instructions: string
    tone: string | null
    out_of_scope_response: string | null
  }
  tools: { name: string; description: string; requires_confirmation: boolean }[]
  rails: { input_enabled: boolean; output_enabled: boolean; scope_description: string | null }
}

export interface MenuItem {
  name: string
  category: string
  price: number
  stock_quantity: number
}

export interface Room {
  name: string
  room_type: string
  price_per_night: number
  availability_count: number
}

export interface StaffUser {
  email: string
  role: AdminRole
  business_id: string | null
}

export interface AuditLogEntry {
  id: number
  actor_email: string
  business_id: string | null
  action: string
  before: string | null
  after: string | null
  timestamp: number
}

// Returned by every destructive DELETE on its first (unconfirmed) call.
export interface ConfirmationRequired {
  status: 'confirmation_required'
  confirm_token: string
  description: string
}

export interface DeleteResult {
  status: 'deleted'
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/admin/api/v1/auth/login', { method: 'POST', body: { email, password } }),

  getConfig: (token: string, businessId: string) =>
    request<BusinessConfig>(`/admin/api/v1/businesses/${businessId}/config`, { token }),

  patchConfig: (token: string, businessId: string, patch: Record<string, unknown>) =>
    request<BusinessConfig>(`/admin/api/v1/businesses/${businessId}/config`, {
      method: 'PATCH',
      token,
      body: patch,
    }),

  listMenuItems: (token: string, businessId: string) =>
    request<MenuItem[]>(`/admin/api/v1/businesses/${businessId}/menu-items`, { token }),

  createMenuItem: (token: string, businessId: string, item: MenuItem) =>
    request<MenuItem>(`/admin/api/v1/businesses/${businessId}/menu-items`, {
      method: 'POST',
      token,
      body: item,
    }),

  updateMenuItem: (token: string, businessId: string, name: string, patch: Partial<MenuItem>) =>
    request<MenuItem>(`/admin/api/v1/businesses/${businessId}/menu-items/${encodeURIComponent(name)}`, {
      method: 'PATCH',
      token,
      body: patch,
    }),

  deleteMenuItem: (token: string, businessId: string, name: string, confirmToken?: string) =>
    request<ConfirmationRequired | DeleteResult>(
      `/admin/api/v1/businesses/${businessId}/menu-items/${encodeURIComponent(name)}`,
      { method: 'DELETE', token, params: confirmToken ? { confirm_token: confirmToken } : undefined },
    ),

  listRooms: (token: string, businessId: string) =>
    request<Room[]>(`/admin/api/v1/businesses/${businessId}/rooms`, { token }),

  createRoom: (token: string, businessId: string, room: Room) =>
    request<Room>(`/admin/api/v1/businesses/${businessId}/rooms`, { method: 'POST', token, body: room }),

  updateRoom: (token: string, businessId: string, name: string, patch: Partial<Room>) =>
    request<Room>(`/admin/api/v1/businesses/${businessId}/rooms/${encodeURIComponent(name)}`, {
      method: 'PATCH',
      token,
      body: patch,
    }),

  deleteRoom: (token: string, businessId: string, name: string, confirmToken?: string) =>
    request<ConfirmationRequired | DeleteResult>(
      `/admin/api/v1/businesses/${businessId}/rooms/${encodeURIComponent(name)}`,
      { method: 'DELETE', token, params: confirmToken ? { confirm_token: confirmToken } : undefined },
    ),

  listStaff: (token: string, businessId: string) =>
    request<StaffUser[]>(`/admin/api/v1/businesses/${businessId}/staff`, { token }),

  createStaff: (token: string, businessId: string, email: string, password: string) =>
    request<StaffUser>(`/admin/api/v1/businesses/${businessId}/staff`, {
      method: 'POST',
      token,
      body: { email, password },
    }),

  deleteStaff: (token: string, businessId: string, email: string, confirmToken?: string) =>
    request<ConfirmationRequired | DeleteResult>(
      `/admin/api/v1/businesses/${businessId}/staff/${encodeURIComponent(email)}`,
      { method: 'DELETE', token, params: confirmToken ? { confirm_token: confirmToken } : undefined },
    ),

  getAuditLog: (token: string, businessId: string) =>
    request<AuditLogEntry[]>(`/admin/api/v1/businesses/${businessId}/audit-log`, { token }),
}

export function isConfirmationRequired(
  result: ConfirmationRequired | DeleteResult,
): result is ConfirmationRequired {
  return result.status === 'confirmation_required'
}
