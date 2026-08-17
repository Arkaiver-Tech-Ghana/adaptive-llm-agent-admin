// Backend identifiers are not a display language. The API speaks
// `room_types`, `list_menu_items`, `row.create`, `4f3a…` — all of which
// leaked straight onto the screen before this module existed. Anything
// that puts a backend-supplied name in front of an owner routes through
// here first.

/** `room_types` / `roomTypes` / `room-types` → `Room Types`. */
export function humanize(identifier: string): string {
  const spaced = identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .trim()
  if (!spaced) return identifier
  return spaced
    .split(/\s+/)
    .map((word) => (word === word.toUpperCase() && word.length <= 3 ? word : word[0].toUpperCase() + word.slice(1)))
    .join(' ')
}

// Table names are owner-written free text, so the old `slice(0, -1)` turned
// "Dupe Test" into "Dupe Tes" and "Staff" into "Staf". These rules leave a
// noun that isn't plural alone, which is the case that used to break.
const IRREGULAR: Record<string, string> = {
  people: 'Person',
  children: 'Child',
  men: 'Man',
  women: 'Woman',
  staff: 'Staff',
  data: 'Record',
}

/** Best-effort singular for a table's display name, used in "Add {x}". */
export function singularize(noun: string): string {
  const trimmed = noun.trim()
  if (!trimmed) return trimmed

  const head = trimmed.slice(0, trimmed.lastIndexOf(' ') + 1)
  const last = trimmed.slice(head.length)
  const lower = last.toLowerCase()

  const irregular = IRREGULAR[lower]
  if (irregular) return head + matchCase(last, irregular)

  // Words that end in `s` but are already singular.
  if (/(ss|us|is|sis|news|ics)$/i.test(last)) return trimmed
  if (!/s$/i.test(last)) return trimmed

  if (/ies$/i.test(last)) return head + matchCase(last, last.slice(0, -3) + 'y')
  if (/(ch|sh|s|x|z)es$/i.test(last)) return head + last.slice(0, -2)
  return head + last.slice(0, -1)
}

function matchCase(source: string, replacement: string): string {
  if (source === source.toLowerCase()) return replacement.toLowerCase()
  return replacement
}

/** A row value as it should read in a table cell. */
export function formatCellValue(value: unknown, type: 'text' | 'number' | 'boolean'): string {
  if (value === null || value === undefined || value === '') return '—'
  if (type === 'boolean') return value ? 'Yes' : 'No'
  if (type === 'number') {
    const num = Number(value)
    return Number.isFinite(num) ? num.toLocaleString() : String(value)
  }
  return String(value)
}

/** `row.create` → `Row created`, `config.update` → `Config updated`. */
export function humanizeAction(action: string): string {
  const [subject, verb] = action.split('.')
  if (!verb) return humanize(action)
  const past: Record<string, string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    login: 'signed in',
    logout: 'signed out',
  }
  return `${humanize(subject)} ${past[verb] ?? humanize(verb).toLowerCase()}`
}

/** The colour family an audit action belongs to. */
export function actionTone(action: string): 'created' | 'updated' | 'deleted' | 'neutral' {
  if (action.endsWith('.create')) return 'created'
  if (action.endsWith('.update')) return 'updated'
  if (action.endsWith('.delete')) return 'deleted'
  return 'neutral'
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

/** "3 minutes ago" — the audit log's primary time read; the exact stamp is the tooltip. */
export function relativeTime(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000
  if (Math.abs(seconds) < 60) return 'just now'
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(Math.round(seconds / 60), 'minute')
}

// Audit before/after payloads arrive as a Python repr or a JSON blob,
// depending on which backend path wrote them. Both are unreadable raw; a
// key/value list is legible either way.
export function parseSnapshot(raw: string | null): Record<string, string> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, value === null ? '—' : String(value)]),
      )
    }
  } catch {
    // Not JSON — fall through to the repr reader below.
  }
  const pairs = [...raw.matchAll(/'([^']+)':\s*('([^']*)'|[^,}]+)/g)]
  if (pairs.length === 0) return null
  return Object.fromEntries(
    pairs
      .map((m) => [m[1], (m[3] ?? m[2] ?? '').trim()] as const)
      // A nested dict's own keys are matched as siblings just below it, so
      // the container row would only ever show a truncated `{'provider':`.
      .filter(([, value]) => !value.startsWith('{'))
      .map(([key, value]) => [key, value === '' ? '—' : value]),
  )
}
