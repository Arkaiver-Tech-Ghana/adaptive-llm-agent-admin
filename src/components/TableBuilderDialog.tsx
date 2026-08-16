import { useState } from 'react'
import { PlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import { api, ApiError, type ColumnType, type TableDef } from '@/lib/api'

// Mirrors SignupPage's slugify — the backend requires the same identifier
// shape for a table_name as it does a business_id (business_config/
// provisioning.py's regex reused verbatim in entities/sqlite_repository.py).
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

interface DraftColumn {
  name: string
  type: ColumnType
  required: boolean
}

const EMPTY_COLUMN: DraftColumn = { name: '', type: 'text', required: false }

interface TableBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function TableBuilderDialog({ open, onOpenChange, onCreated }: TableBuilderDialogProps) {
  const { user } = useAuth()
  const businessId = user!.businessId!
  const token = user!.token

  const [displayName, setDisplayName] = useState('')
  const [tableName, setTableName] = useState('')
  const [tableNameEdited, setTableNameEdited] = useState(false)
  const [columns, setColumns] = useState<DraftColumn[]>([{ ...EMPTY_COLUMN }])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function reset() {
    setDisplayName('')
    setTableName('')
    setTableNameEdited(false)
    setColumns([{ ...EMPTY_COLUMN }])
    setError(null)
  }

  function onDisplayNameChange(value: string) {
    setDisplayName(value)
    if (!tableNameEdited) setTableName(slugify(value))
  }

  function updateColumn(index: number, patch: Partial<DraftColumn>) {
    setColumns(columns.map((col, i) => (i === index ? { ...col, ...patch } : col)))
  }

  async function onSubmit() {
    setBusy(true)
    setError(null)
    const tableDef: TableDef = {
      table_name: tableName,
      display_name: displayName,
      tool_linked: null,
      columns: columns.filter((c) => c.name.trim() !== ''),
    }
    try {
      await api.createTable(token, businessId, tableDef)
      onCreated()
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New table</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="table-display-name">Name</Label>
            <Input
              id="table-display-name"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="table-name">Table ID</Label>
            <Input
              id="table-name"
              value={tableName}
              onChange={(e) => {
                setTableNameEdited(true)
                setTableName(slugify(e.target.value))
              }}
              pattern="[a-z0-9_]+"
              title="Lowercase letters, digits, and underscores only"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Columns</Label>
            {columns.map((col, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Column name"
                  value={col.name}
                  onChange={(e) => updateColumn(i, { name: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={col.type}
                  onValueChange={(value) => updateColumn(i, { type: value as ColumnType })}
                >
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
                    checked={col.required}
                    onChange={(e) => updateColumn(i, { required: e.target.checked })}
                  />
                  Required
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setColumns(columns.filter((_, j) => j !== i))}
                  disabled={columns.length === 1}
                >
                  <XIcon />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setColumns([...columns, { ...EMPTY_COLUMN }])}
            >
              <PlusIcon /> Add column
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create table'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
