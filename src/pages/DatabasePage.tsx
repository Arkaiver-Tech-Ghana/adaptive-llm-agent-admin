import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronRightIcon, DatabaseIcon, PlusIcon, SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableBuilderDialog } from '@/components/TableBuilderDialog'
import { useAuth } from '@/lib/auth'
import { humanize } from '@/lib/format'
import { api, type TableDef } from '@/lib/api'

// Owner-only. Not primed for any one Business — no "Menu Items"/"Rooms"
// screen, just whatever Custom Tables this owner has defined themselves
// (ADR 0008). Table detail/row CRUD lives at /database/:tableName
// (DatabaseTablePage.tsx), reusing EntityCrudPage against the table's own
// dynamic columns.
export function DatabasePage() {
  const { user } = useAuth()
  const businessId = user!.businessId!
  const token = user!.token

  const [tables, setTables] = useState<TableDef[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      setTables(await api.listTables(token, businessId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Database"
        description="Your business's own data — prices, availability, opening hours, whatever your customers ask about. The assistant reads from these tables to answer, and writes to them when someone books or orders."
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> New table
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={DatabaseIcon}
          title="No tables yet"
          description="A table is one kind of thing your customers ask about — rooms, menu items, appointments. Create one and the assistant can start answering from it."
          action={
            <Button onClick={() => setCreating(true)}>
              <PlusIcon /> Create your first table
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <Link
              key={table.table_name}
              to={`/database/${encodeURIComponent(table.table_name)}`}
              className="group/table flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow outline-none hover:ring-foreground/20 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-heading text-base leading-snug font-medium">
                    {table.display_name}
                  </span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {table.table_name}
                  </span>
                </span>
                <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover/table:translate-x-0.5" />
              </div>

              <div className="flex flex-wrap gap-1">
                {table.columns.slice(0, 3).map((col) => (
                  <Badge key={col.name} variant="outline" className="font-normal">
                    {humanize(col.name)}
                  </Badge>
                ))}
                {table.columns.length > 3 && (
                  <Badge variant="ghost" className="text-muted-foreground">
                    +{table.columns.length - 3} more
                  </Badge>
                )}
                {table.columns.length === 0 && (
                  <span className="text-xs text-muted-foreground">No columns yet</span>
                )}
              </div>

              {table.tool_linked && (
                <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <SparklesIcon className="size-3.5 text-primary" />
                  The assistant can use this table
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <TableBuilderDialog open={creating} onOpenChange={setCreating} onCreated={refresh} />
    </div>
  )
}
