import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EntityCrudPage, type EntityColumn } from '@/components/EntityCrudPage'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ManageColumnsDialog } from '@/components/ManageColumnsDialog'
import { useAuth } from '@/lib/auth'
import { api, type EntityRow, type TableDef } from '@/lib/api'

// Owner-only. Drives EntityCrudPage with this table's own dynamic columns
// instead of a hardcoded array — the same generic engine that used to run
// MenuItemsPage/RoomsPage, now parameterized per owner-defined table.
export function DatabaseTablePage() {
  const { tableName = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const businessId = user!.businessId!
  const token = user!.token

  const [table, setTable] = useState<TableDef | null | undefined>(undefined)
  const [deleting, setDeleting] = useState(false)
  const [managingColumns, setManagingColumns] = useState(false)

  useEffect(() => {
    api
      .listTables(token, businessId)
      .then((tables) => setTable(tables.find((t) => t.table_name === tableName) ?? null))
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : String(err))
        setTable(null)
      })
  }, [token, businessId, tableName])

  if (table === undefined) return <p className="text-muted-foreground">Loading…</p>
  if (table === null) return <Navigate to="/database" replace />

  const columns: EntityColumn<EntityRow>[] = table.columns.map((col) => ({
    key: col.name,
    label: col.name,
    type: col.type,
  }))
  const emptyItem: EntityRow = Object.fromEntries([
    ['id', ''],
    ...table.columns.map((col) => [col.name, col.type === 'boolean' ? false : col.type === 'number' ? 0 : '']),
  ]) as EntityRow

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link to="/database" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Database
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setManagingColumns(true)}>
            Manage columns
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleting(true)}>
            Delete table
          </Button>
        </div>
      </div>

      <EntityCrudPage<EntityRow>
        key={table.columns.map((c) => c.name).join(',')}
        title={table.display_name}
        idKey="id"
        columns={columns}
        emptyItem={emptyItem}
        list={(t, b) => api.listRows(t, b, tableName)}
        create={(t, b, row) => api.createRow(t, b, tableName, row)}
        update={(t, b, id, patch) => api.updateRow(t, b, tableName, id, patch)}
        remove={(t, b, id, confirmToken) => api.deleteRow(t, b, tableName, id, confirmToken)}
      />

      <ManageColumnsDialog
        open={managingColumns}
        onOpenChange={setManagingColumns}
        table={table}
        onChanged={setTable}
      />

      <ConfirmDeleteDialog
        open={deleting}
        onOpenChange={setDeleting}
        requestDelete={(confirmToken) => api.deleteTable(token, businessId, tableName, confirmToken)}
        onDeleted={() => {
          toast.success(`Table "${table.display_name}" deleted`)
          navigate('/database')
        }}
      />
    </div>
  )
}
