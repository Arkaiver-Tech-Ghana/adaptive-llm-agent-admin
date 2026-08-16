import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TableBuilderDialog } from '@/components/TableBuilderDialog'
import { useAuth } from '@/lib/auth'
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Database</h1>
        <Button onClick={() => setCreating(true)}>New table</Button>
      </div>

      {!loading && tables.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tables yet. Create one to start storing your own data.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <Link key={table.table_name} to={`/database/${encodeURIComponent(table.table_name)}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  {table.display_name}
                  {table.tool_linked && <Badge variant="secondary">tool-linked</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {table.columns.length} column{table.columns.length === 1 ? '' : 's'}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <TableBuilderDialog open={creating} onOpenChange={setCreating} onCreated={refresh} />
    </div>
  )
}
