import { useState } from 'react'
import { toast } from 'sonner'
import { CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useAuth } from '@/lib/auth'
import { humanize } from '@/lib/format'
import { api, ApiError, type ColumnType, type TableDef } from '@/lib/api'

const TYPE_LABEL: Record<ColumnType, string> = { text: 'Text', number: 'Number', boolean: 'Yes/No' }

interface ManageColumnsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: TableDef
  onChanged: (updated: TableDef) => void
}

// Column type/id_type aren't editable here — see IdType's docstring
// (backend entities/base.py) and EntityRepository.add_column's comment
// for why: retyping a column with existing data needs a per-value
// conversion story neither side has built.
export function ManageColumnsDialog({ open, onOpenChange, table, onChanged }: ManageColumnsDialogProps) {
  const { user } = useAuth()
  const businessId = user!.businessId!
  const token = user!.token

  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({})
  const [deletingColumn, setDeletingColumn] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<ColumnType>('text')
  const [newRequired, setNewRequired] = useState(false)
  const [busy, setBusy] = useState(false)

  async function rename(columnName: string) {
    const draft = (renameDrafts[columnName] ?? columnName).trim()
    if (!draft || draft === columnName) return
    setBusy(true)
    try {
      const updated = await api.renameColumn(token, businessId, table.table_name, columnName, draft)
      onChanged(updated)
      setRenameDrafts((prev) => {
        const next = { ...prev }
        delete next[columnName]
        return next
      })
      toast.success('Column renamed')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function addColumn() {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    try {
      const updated = await api.addColumn(token, businessId, table.table_name, {
        name,
        type: newType,
        required: newRequired,
      })
      onChanged(updated)
      setNewName('')
      setNewType('text')
      setNewRequired(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Columns in {table.display_name}</DialogTitle>
          <DialogDescription>
            Each column is one fact you keep about a {table.display_name.toLowerCase()} — a price, a
            name, whether it's available. Changes apply to every row at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          {table.columns.length === 0 && (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No columns yet — add the first one below.
            </p>
          )}
          {table.columns.map((col) => {
            const draft = renameDrafts[col.name] ?? col.name
            const renamed = draft.trim() !== col.name && draft.trim() !== ''
            return (
              <div key={col.name} className="flex items-center gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setRenameDrafts((prev) => ({ ...prev, [col.name]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') rename(col.name)
                  }}
                  className="flex-1"
                  aria-label={`Name of the ${humanize(col.name)} column`}
                />
                <Badge variant="secondary" className="shrink-0">
                  {TYPE_LABEL[col.type]}
                  {col.required ? ' · required' : ''}
                </Badge>
                {/* Only shown once there is a rename to commit. Sitting
                    there permanently, this tick was a ghost icon button
                    the same weight as the delete beside it — and one of
                    the two destroys a column of data. */}
                {renamed && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={busy}
                    onClick={() => rename(col.name)}
                    aria-label={`Rename ${col.name} to ${draft.trim()}`}
                  >
                    <CheckIcon />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive-ghost"
                  size="icon-sm"
                  disabled={busy}
                  onClick={() => setDeletingColumn(col.name)}
                  aria-label={`Delete the ${humanize(col.name)} column`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <Label htmlFor="new-column-name">Add a column</Label>
          <div className="flex items-center gap-2">
            <Input
              id="new-column-name"
              placeholder="e.g. price"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addColumn()
              }}
              className="flex-1"
            />
            <Select value={newType} onValueChange={(value) => setNewType(value as ColumnType)}>
              <SelectTrigger size="sm" className="w-28" aria-label="Column type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Yes/No</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" disabled={busy || !newName.trim()} onClick={addColumn}>
              <PlusIcon /> Add
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="new-column-required"
              checked={newRequired}
              onCheckedChange={(checked) => setNewRequired(checked === true)}
            />
            <Label htmlFor="new-column-required" className="text-xs font-normal text-muted-foreground">
              Every row must have a value for this
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDeleteDialog
        open={deletingColumn !== null}
        onOpenChange={(next) => {
          if (!next) setDeletingColumn(null)
        }}
        what={`the “${humanize(deletingColumn ?? '')}” column`}
        consequence={`Its value is erased from every row in ${table.display_name}. This can’t be undone.`}
        confirmLabel="Delete column"
        requestDelete={(confirmToken) =>
          api.deleteColumn(token, businessId, table.table_name, deletingColumn!, confirmToken)
        }
        onDeleted={() => {
          toast.success('Column deleted')
          onChanged({ ...table, columns: table.columns.filter((c) => c.name !== deletingColumn) })
          setDeletingColumn(null)
        }}
      />
    </Dialog>
  )
}
