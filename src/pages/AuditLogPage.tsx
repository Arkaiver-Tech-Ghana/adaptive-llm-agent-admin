import { Fragment, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDownIcon, ScrollTextIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/lib/auth'
import { actionTone, humanize, humanizeAction, parseSnapshot, relativeTime } from '@/lib/format'
import { api, type AuditLogEntry } from '@/lib/api'
import { cn } from '@/lib/utils'

// The two fixed Businesses (see lib/business.ts) — platform_operator has
// no business_id of its own (ADR 0006) and the backend has no
// cross-Business "all audit log" endpoint, so they pick one at a time.
const KNOWN_BUSINESSES = ['kampuscrave', 'hotel']

const TONE_CLASS: Record<ReturnType<typeof actionTone>, string> = {
  created: 'bg-primary/10 text-primary',
  updated: 'bg-amber-500/12 text-amber-700',
  deleted: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
}

export function AuditLogPage() {
  const { user } = useAuth()
  const token = user!.token
  const [businessId, setBusinessId] = useState(user!.businessId ?? KNOWN_BUSINESSES[0])
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setExpanded(null)
    api
      .getAuditLog(token, businessId)
      // The endpoint returns insertion order; an audit log is read newest
      // first, which is also what the page says it does.
      .then((loaded) => setEntries([...loaded].sort((a, b) => b.timestamp - a.timestamp)))
      .catch((err) => toast.error(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [token, businessId])

  const actions = useMemo(
    () => [...new Set(entries.map((e) => e.action))].sort(),
    [entries],
  )
  const visible = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.action === filter)),
    [entries, filter],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        description="Every change made to this business's settings and data, and who made it. Newest first."
        actions={
          <>
            {actions.length > 1 && (
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-44" aria-label="Filter by action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All activity</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {humanizeAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {user!.role === 'platform_operator' && (
              <Select value={businessId} onValueChange={setBusinessId}>
                <SelectTrigger className="w-40" aria-label="Business">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_BUSINESSES.map((id) => (
                    <SelectItem key={id} value={id}>
                      {humanize(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        }
      />

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ScrollTextIcon}
          title="Nothing recorded yet"
          description="Changes to your agent settings, tables, and rows show up here as soon as anyone makes one."
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-4 text-xs text-muted-foreground">When</TableHead>
                <TableHead className="px-4 text-xs text-muted-foreground">Who</TableHead>
                <TableHead className="px-4 text-xs text-muted-foreground">What changed</TableHead>
                <TableHead className="w-0 px-4">
                  <span className="sr-only">Details</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((entry) => {
                const at = new Date(entry.timestamp * 1000)
                const isOpen = expanded === entry.id
                const hasDetail = Boolean(entry.before || entry.after)
                return (
                  <Fragment key={entry.id}>
                    <TableRow
                      className={cn(hasDetail && 'cursor-pointer', isOpen && 'bg-muted/40')}
                      onClick={() => hasDetail && setExpanded(isOpen ? null : entry.id)}
                    >
                      <TableCell
                        className="px-4 py-2.5 text-muted-foreground"
                        title={at.toLocaleString()}
                      >
                        {relativeTime(at)}
                      </TableCell>
                      <TableCell className="max-w-56 truncate px-4 py-2.5" title={entry.actor_email}>
                        {entry.actor_email}
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <span
                          className={cn(
                            'inline-flex h-5 items-center rounded-4xl px-2 text-xs font-medium',
                            TONE_CLASS[actionTone(entry.action)],
                          )}
                        >
                          {humanizeAction(entry.action)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right">
                        {hasDetail && (
                          <ChevronDownIcon
                            className={cn(
                              'inline size-4 text-muted-foreground transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4} className="bg-muted/25 px-4 py-4 whitespace-normal">
                          <SnapshotDiff before={entry.before} after={entry.after} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
              {visible.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No {humanizeAction(filter).toLowerCase()} entries.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// Before/After arrived as two truncated blobs of Python repr in adjacent
// columns, which is unreadable and hides the one thing anyone opens an
// audit log for: which field actually moved.
function SnapshotDiff({ before, after }: { before: string | null; after: string | null }) {
  const from = parseSnapshot(before)
  const to = parseSnapshot(after)

  if (!from && !to) {
    return <p className="text-sm text-muted-foreground">{before ?? after ?? 'No details recorded.'}</p>
  }

  // Changed fields first: a config save rewrites the whole record, so the
  // one line that actually moved would otherwise be buried in twenty
  // identical ones.
  const keys = [...new Set([...Object.keys(from ?? {}), ...Object.keys(to ?? {})])].sort(
    (a, b) => Number(from?.[b] !== to?.[b]) - Number(from?.[a] !== to?.[a]),
  )

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[minmax(5rem,1fr)_minmax(0,2fr)_minmax(0,2fr)] gap-x-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <span>Field</span>
        <span>{from ? 'Before' : ''}</span>
        <span>{to ? 'After' : ''}</span>
      </div>
      {keys.map((key) => {
        const wasValue = from?.[key]
        const nowValue = to?.[key]
        const changed = from && to && wasValue !== nowValue
        return (
          <div
            key={key}
            className={cn(
              'grid grid-cols-[minmax(5rem,1fr)_minmax(0,2fr)_minmax(0,2fr)] gap-x-4 rounded-md px-1 py-0.5 text-sm',
              changed && 'bg-amber-500/8',
            )}
          >
            <span className="truncate text-muted-foreground">{humanize(key)}</span>
            <span className={cn('break-all', changed && 'text-muted-foreground line-through')}>
              {from ? (wasValue ?? '—') : ''}
            </span>
            <span className={cn('break-all', changed && 'font-medium')}>
              {to ? (nowValue ?? '—') : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
