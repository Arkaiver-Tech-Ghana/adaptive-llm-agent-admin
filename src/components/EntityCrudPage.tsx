import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon, TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/lib/auth'
import { formatCellValue, singularize } from '@/lib/format'
import type { ConfirmationRequired, DeleteResult } from '@/lib/api'

// Generic CRUD table over a "data row" resource keyed by a unique string
// field. Originally proven on the old fixed menu-items/rooms endpoints;
// now the engine behind DatabasePage.tsx's owner-defined Custom Tables,
// driven by a TableDef's dynamic columns instead of a hardcoded array.
// Parameterized by column config + API calls rather than duplicated per
// resource/table.
export interface EntityColumn<T> {
  key: keyof T
  label: string
  type: 'text' | 'number' | 'boolean'
  step?: string
  required?: boolean
}

interface EntityCrudPageProps<T extends object> {
  title: string
  description?: ReactNode
  backTo?: { label: string; to: string }
  headerActions?: ReactNode
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
  description,
  backTo,
  headerActions,
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
  const [query, setQuery] = useState('')

  // The record's own name, e.g. "Room Type" for a "Room Types" table. This
  // was `title.slice(0, -1)`, which produced "Add Dupe Tes" for any table
  // whose name doesn't happen to end in a plural s.
  const noun = singularize(title)

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
    await create(token, businessId, draft)
    toast.success(`${noun} added`)
    setCreating(false)
    refresh()
  }

  async function submitEdit() {
    if (!editing) return
    const id = String(editing[idKey])
    await update(token, businessId, id, draft)
    toast.success(`${noun} updated`)
    setEditing(null)
    refresh()
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter((item) =>
      columns.some((col) => String(item[col.key] ?? '').toLowerCase().includes(needle)),
    )
  }, [items, columns, query])

  const searchable = items.length > 5

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        backTo={backTo}
        actions={
          <>
            {headerActions}
            <Button onClick={openCreate}>
              <PlusIcon /> Add {noun.toLowerCase()}
            </Button>
          </>
        }
      />

      {loading ? (
        <TableSkeleton columns={columns.length} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={TableIcon}
          title={`No ${title.toLowerCase()} yet`}
          description={`Rows you add here are what the assistant reads from and writes to when a customer asks about ${title.toLowerCase()}.`}
          action={
            <Button onClick={openCreate}>
              <PlusIcon /> Add {noun.toLowerCase()}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {searchable && (
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full max-w-64">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-7.5"
                  placeholder={`Search ${title.toLowerCase()}`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={`Search ${title.toLowerCase()}`}
                />
              </div>
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {visible.length} of {items.length}
              </span>
            </div>
          )}

          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {columns.map((col) => (
                    <TableHead key={String(col.key)} className="px-4 text-xs text-muted-foreground">
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-0 px-4 text-right text-xs text-muted-foreground">
                    <span className="sr-only">Row actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => (
                  <TableRow key={String(item[idKey])} className="group/row">
                    {columns.map((col) => (
                      <TableCell
                        key={String(col.key)}
                        className={`px-4 py-2.5 ${col.type === 'number' ? 'tabular-nums' : ''}`}
                      >
                        {formatCellValue(item[col.key], col.type)}
                      </TableCell>
                    ))}
                    {/* The action buttons live in an inner flex row: putting
                        `flex` on the cell itself dropped its `align-middle`,
                        so the controls sat off-centre against the text. */}
                    <TableCell className="px-4 py-2.5">
                      <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(item)}
                          aria-label={`Edit this ${noun.toLowerCase()}`}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="destructive-ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Delete this ${noun.toLowerCase()}`}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={columns.length + 1}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      Nothing matches “{query}”.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <EntityFormDialog
        open={creating}
        onOpenChange={setCreating}
        title={`Add ${noun.toLowerCase()}`}
        description={`This adds one row to ${title}.`}
        submitLabel="Add"
        busyLabel="Adding…"
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
        title={`Edit ${noun.toLowerCase()}`}
        description="Changes take effect for the assistant immediately."
        submitLabel="Save changes"
        busyLabel="Saving…"
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
          what={`this ${noun.toLowerCase()}`}
          consequence={`The assistant will stop being able to see it. This can’t be undone.`}
          requestDelete={(confirmToken) =>
            remove(token, businessId, String(deleteTarget[idKey]), confirmToken)
          }
          onDeleted={() => {
            toast.success(`${noun} deleted`)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="h-10 border-b bg-muted/40" />
      {Array.from({ length: 4 }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className="h-4 flex-1" style={{ maxWidth: col === 0 ? '10rem' : '7rem' }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EntityFormDialog<T extends object>({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  busyLabel,
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
  description: string
  submitLabel: string
  busyLabel: string
  columns: EntityColumn<T>[]
  idKey: keyof T
  draft: T
  setDraft: (draft: T) => void
  idEditable: boolean
  onSubmit: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  // Every other submit in the app latches while its request is in flight;
  // this one didn't, so a double-fire — an Enter that also activated the
  // focused Save, a second click before the dialog closed — sent a second
  // POST and wrote a duplicate row. The latch closes that whole class.
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await onSubmit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {columns.map((col) =>
            col.type === 'boolean' ? (
              <div key={String(col.key)} className="flex items-center gap-2.5">
                <Checkbox
                  id={String(col.key)}
                  disabled={busy || (col.key === idKey && !idEditable)}
                  checked={Boolean(draft[col.key])}
                  onCheckedChange={(checked) =>
                    setDraft({ ...draft, [col.key]: checked === true } as T)
                  }
                />
                <Label htmlFor={String(col.key)} className="font-normal">
                  {col.label}
                </Label>
              </div>
            ) : (
              <div key={String(col.key)} className="flex flex-col gap-1.5">
                <Label htmlFor={String(col.key)}>
                  {col.label}
                  {col.required === false && (
                    <span className="font-normal text-muted-foreground">Optional</span>
                  )}
                </Label>
                <Input
                  id={String(col.key)}
                  type={col.type}
                  step={col.step}
                  disabled={busy || (col.key === idKey && !idEditable)}
                  value={String(draft[col.key] ?? '')}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [col.key]: col.type === 'number' ? Number(e.target.value) : e.target.value,
                    } as T)
                  }
                  required={col.required !== false}
                />
              </div>
            ),
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? busyLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
