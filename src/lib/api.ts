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

export type AdminRole = 'owner' | 'platform_operator'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface SignupRequest {
  business_id: string
  display_name: string
  owner_email: string
  owner_password: string
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
  tools: { name: string; description: string; requires_confirmation: boolean; enabled: boolean }[]
  rails: { input_enabled: boolean; output_enabled: boolean; scope_description: string | null }
}

export type ColumnType = 'text' | 'number' | 'boolean'

export interface ColumnDef {
  name: string
  type: ColumnType
  required: boolean
}

export type IdType = 'uuid' | 'auto_increment'

export interface TableDef {
  table_name: string
  display_name: string
  columns: ColumnDef[]
  id_type: IdType
  tool_linked: string | null
}

// A row's shape is whatever its TableDef's columns say — "id" plus one
// key per column. Not statically typed per-table since tables are
// owner-defined at runtime, not known at build time. `id` is a number for
// an auto_increment table, a uuid string otherwise.
export type EntityRow = Record<string, unknown> & { id: string | number }

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

  signup: (body: SignupRequest) =>
    request<LoginResponse>('/admin/api/v1/auth/signup', { method: 'POST', body }),

  getConfig: (token: string, businessId: string) =>
    request<BusinessConfig>(`/admin/api/v1/businesses/${businessId}/config`, { token }),

  patchConfig: (token: string, businessId: string, patch: Record<string, unknown>) =>
    request<BusinessConfig>(`/admin/api/v1/businesses/${businessId}/config`, {
      method: 'PATCH',
      token,
      body: patch,
    }),

  getAuditLog: (token: string, businessId: string) =>
    request<AuditLogEntry[]>(`/admin/api/v1/businesses/${businessId}/audit-log`, { token }),

  listTables: (token: string, businessId: string) =>
    request<TableDef[]>(`/admin/api/v1/businesses/${businessId}/tables`, { token }),

  createTable: (token: string, businessId: string, tableDef: TableDef) =>
    request<TableDef>(`/admin/api/v1/businesses/${businessId}/tables`, {
      method: 'POST',
      token,
      body: tableDef,
    }),

  deleteTable: (token: string, businessId: string, tableName: string, confirmToken?: string) =>
    request<ConfirmationRequired | DeleteResult>(
      `/admin/api/v1/businesses/${businessId}/tables/${encodeURIComponent(tableName)}`,
      { method: 'DELETE', token, params: confirmToken ? { confirm_token: confirmToken } : undefined },
    ),

  listRows: (token: string, businessId: string, tableName: string) =>
    request<EntityRow[]>(
      `/admin/api/v1/businesses/${businessId}/tables/${encodeURIComponent(tableName)}/rows`,
      { token },
    ),

  createRow: (token: string, businessId: string, tableName: string, row: Record<string, unknown>) =>
    request<EntityRow>(
      `/admin/api/v1/businesses/${businessId}/tables/${encodeURIComponent(tableName)}/rows`,
      { method: 'POST', token, body: row },
    ),

  updateRow: (
    token: string,
    businessId: string,
    tableName: string,
    rowId: string,
    patch: Record<string, unknown>,
  ) =>
    request<EntityRow>(
      `/admin/api/v1/businesses/${businessId}/tables/${encodeURIComponent(tableName)}/rows/${encodeURIComponent(rowId)}`,
      { method: 'PATCH', token, body: patch },
    ),

  deleteRow: (token: string, businessId: string, tableName: string, rowId: string, confirmToken?: string) =>
    request<ConfirmationRequired | DeleteResult>(
      `/admin/api/v1/businesses/${businessId}/tables/${encodeURIComponent(tableName)}/rows/${encodeURIComponent(rowId)}`,
      { method: 'DELETE', token, params: confirmToken ? { confirm_token: confirmToken } : undefined },
    ),
}

export function isConfirmationRequired(
  result: ConfirmationRequired | DeleteResult,
): result is ConfirmationRequired {
  return result.status === 'confirmation_required'
}
