import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useAuth } from '@/lib/auth'
import type { ConfirmationRequired, DeleteResult } from '@/lib/api'

// Generic CRUD table over a "data row" resource keyed by a unique string
// field (menu items by name, rooms by name — issue #17's "data-row CRUD"
// pattern, proven identical across both Businesses). Parameterized by
// column config + API calls rather than duplicated per resource.
export interface EntityColumn<T> {
  key: keyof T
  label: string
  type: 'text' | 'number'
  step?: string
}

interface EntityCrudPageProps<T extends object> {
  title: string
  idKey: keyof T
  columns: EntityColumn<T>[]
  emptyItem: T
  list: (token: string, businessId: string) => Promise<T[]>
  create: (token: string, businessId: string, item: T) => Promise<T>
  update: (token: string, businessId: string, id: string, patch: Partial<T>) => Promise<T>
  remove: (
    token: string,
    businessId: string,
    id: string,
    confirmToken?: string,
  ) => Promise<ConfirmationRequired | DeleteResult>
}

export function EntityCrudPage<T extends object>({
  title,
  idKey,
  columns,
  emptyItem,
  list,
  create,
  update,
  remove,
}: EntityCrudPageProps<T>) {
  const { user } = useAuth()
  const businessId = user!.businessId!
  const token = user!.token

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<T | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<T>(emptyItem)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      setItems(await list(token, businessId))
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

  function openCreate() {
    setDraft(emptyItem)
    setCreating(true)
  }

  function openEdit(item: T) {
    setDraft(item)
    setEditing(item)
  }

  async function submitCreate() {
    try {
      await create(token, businessId, draft)
      toast.success(`${title.slice(0, -1)} created`)
      setCreating(false)
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function submitEdit() {
    if (!editing) return
    try {
      const id = String(editing[idKey])
      await update(token, businessId, id, draft)
      toast.success(`${title.slice(0, -1)} updated`)
      setEditing(null)
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <Button onClick={openCreate}>Add</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)}>{col.label}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={String(item[idKey])}>
              {columns.map((col) => (
                <TableCell key={String(col.key)}>{String(item[col.key])}</TableCell>
              ))}
              <TableCell className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(item)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                No {title.toLowerCase()} yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <EntityFormDialog
        open={creating}
        onOpenChange={setCreating}
        title={`Add ${title.slice(0, -1)}`}
        columns={columns}
        idKey={idKey}
        draft={draft}
        setDraft={setDraft}
        idEditable
        onSubmit={submitCreate}
      />

      <EntityFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={`Edit ${title.slice(0, -1)}`}
        columns={columns}
        idKey={idKey}
        draft={draft}
        setDraft={setDraft}
        idEditable={false}
        onSubmit={submitEdit}
      />

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          requestDelete={(confirmToken) =>
            remove(token, businessId, String(deleteTarget[idKey]), confirmToken)
          }
          onDeleted={() => {
            toast.success(`${title.slice(0, -1)} deleted`)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function EntityFormDialog<T extends object>({
  open,
  onOpenChange,
  title,
  columns,
  idKey,
  draft,
  setDraft,
  idEditable,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  columns: EntityColumn<T>[]
  idKey: keyof T
  draft: T
  setDraft: (draft: T) => void
  idEditable: boolean
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          {columns.map((col) => (
            <div key={String(col.key)} className="flex flex-col gap-1.5">
              <Label htmlFor={String(col.key)}>{col.label}</Label>
              <Input
                id={String(col.key)}
                type={col.type}
                step={col.step}
                disabled={col.key === idKey && !idEditable}
                value={String(draft[col.key] ?? '')}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [col.key]: col.type === 'number' ? Number(e.target.value) : e.target.value,
                  } as T)
                }
                required
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
