import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { api, type AuditLogEntry } from '@/lib/api'

// The two fixed Businesses (see lib/business.ts) — platform_operator has
// no business_id of its own (ADR 0006) and the backend has no
// cross-Business "all audit log" endpoint, so they pick one at a time.
const KNOWN_BUSINESSES = ['kampuscrave', 'hotel']

export function AuditLogPage() {
  const { user } = useAuth()
  const token = user!.token
  const [businessId, setBusinessId] = useState(user!.businessId ?? KNOWN_BUSINESSES[0])
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .getAuditLog(token, businessId)
      .then(setEntries)
      .catch((err) => toast.error(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [token, businessId])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Audit Log</h1>
        {user!.role === 'platform_operator' && (
          <Select value={businessId} onValueChange={setBusinessId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KNOWN_BUSINESSES.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Before</TableHead>
            <TableHead>After</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{new Date(entry.timestamp * 1000).toLocaleString()}</TableCell>
              <TableCell>{entry.actor_email}</TableCell>
              <TableCell>{entry.action}</TableCell>
              <TableCell className="max-w-64 truncate" title={entry.before ?? ''}>
                {entry.before ?? '—'}
              </TableCell>
              <TableCell className="max-w-64 truncate" title={entry.after ?? ''}>
                {entry.after ?? '—'}
              </TableCell>
            </TableRow>
          ))}
          {!loading && entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No audit log entries yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
