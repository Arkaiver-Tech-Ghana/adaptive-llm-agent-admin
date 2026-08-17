import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Columns3Icon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { EntityCrudPage, type EntityColumn } from '@/components/EntityCrudPage'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ManageColumnsDialog } from '@/components/ManageColumnsDialog'
import { useAuth } from '@/lib/auth'
import { humanize } from '@/lib/format'
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

  if (table === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (table === null) return <Navigate to="/database" replace />

  // `col.name` is a storage identifier (`room_type`, `is_available`);
  // header cells and form labels get the human form of it.
  const columns: EntityColumn<EntityRow>[] = table.columns.map((col) => ({
    key: col.name,
    label: humanize(col.name),
    type: col.type,
    required: col.required,
  }))
  const emptyItem: EntityRow = Object.fromEntries([
    ['id', ''],
    ...table.columns.map((col) => [col.name, col.type === 'boolean' ? false : col.type === 'number' ? 0 : '']),
  ]) as EntityRow

  const columnCount = table.columns.length

  return (
    <>
      {/* One header row, not two. Manage columns and Delete table used to
          sit in a strip above the title, which put the table's most
          destructive control higher on the page than its primary one. */}
      <EntityCrudPage<EntityRow>
        key={table.columns.map((c) => c.name).join(',')}
        title={table.display_name}
        description={
          <>
            {columnCount} column{columnCount === 1 ? '' : 's'} · stored as{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{table.table_name}</code>
            {table.tool_linked ? ' · the assistant can read and write this table' : ''}
          </>
        }
        backTo={{ label: 'Database', to: '/database' }}
        headerActions={
          <>
            <Button variant="outline" onClick={() => setManagingColumns(true)}>
              <Columns3Icon /> Columns
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More table actions">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Deferred a tick: opening the dialog inside onSelect
                    mounts it while the menu is still tearing its own
                    dismissable layer down, and the dialog is dismissed
                    along with it before it ever paints. */}
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setTimeout(() => setDeleting(true), 0)}
                >
                  <Trash2Icon /> Delete table
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
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
        what={`the ${table.display_name} table`}
        consequence="Every row in it is deleted with it, and the assistant loses the tools built from it. This can’t be undone."
        confirmLabel="Delete table"
        requestDelete={(confirmToken) => api.deleteTable(token, businessId, tableName, confirmToken)}
        onDeleted={() => {
          toast.success(`${table.display_name} deleted`)
          navigate('/database')
        }}
      />
    </>
  )
}
