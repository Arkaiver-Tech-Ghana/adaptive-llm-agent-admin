import { useState } from 'react'
import { toast } from 'sonner'
import { CheckIcon, PlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useAuth } from '@/lib/auth'
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage columns</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {table.columns.length === 0 && (
            <p className="text-sm text-muted-foreground">No columns yet — add one below.</p>
          )}
          {table.columns.map((col) => (
            <div key={col.name} className="flex items-center gap-2">
              <Input
                value={renameDrafts[col.name] ?? col.name}
                onChange={(e) => setRenameDrafts((prev) => ({ ...prev, [col.name]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') rename(col.name)
                }}
                className="flex-1"
              />
              <Badge variant="secondary">
                {TYPE_LABEL[col.type]}
                {col.required ? ', required' : ''}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={busy || (renameDrafts[col.name] ?? col.name).trim() === col.name}
                onClick={() => rename(col.name)}
                aria-label={`Save ${col.name}`}
              >
                <CheckIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={busy}
                onClick={() => setDeletingColumn(col.name)}
                aria-label={`Delete ${col.name}`}
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <Label>Add column</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Column name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Select value={newType} onValueChange={(value) => setNewType(value as ColumnType)}>
              <SelectTrigger size="sm" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Yes/No</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="size-3.5 rounded border-input"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
              />
              Required
            </label>
            <Button type="button" variant="outline" size="sm" disabled={busy || !newName.trim()} onClick={addColumn}>
              <PlusIcon /> Add
            </Button>
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
        requestDelete={(confirmToken) =>
          api.deleteColumn(token, businessId, table.table_name, deletingColumn!, confirmToken)
        }
        onDeleted={() => {
          onChanged({ ...table, columns: table.columns.filter((c) => c.name !== deletingColumn) })
          setDeletingColumn(null)
        }}
      />
    </Dialog>
  )
}
