import { useState } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useAuth } from '@/lib/auth'
import { api, ApiError, type ColumnType, type IdType, type TableDef } from '@/lib/api'

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
  const [idType, setIdType] = useState<IdType>('uuid')
  const [columns, setColumns] = useState<DraftColumn[]>([{ ...EMPTY_COLUMN }])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function reset() {
    setDisplayName('')
    setTableName('')
    setTableNameEdited(false)
    setIdType('uuid')
    setColumns([{ ...EMPTY_COLUMN }])
    setShowAdvanced(false)
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
      id_type: idType,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New table</DialogTitle>
          <DialogDescription>
            One table holds one kind of thing — rooms, menu items, appointments. Once it exists, the
            assistant can look things up in it and add to it for your customers.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="table-display-name">What does this table hold?</Label>
            <Input
              id="table-display-name"
              placeholder="e.g. Room types"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              required
            />
            {/* The storage identifier is derived, not asked for. It used to
                be a required field of its own, labelled "Table ID", with no
                explanation of what it was or why it couldn't have spaces. */}
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              Stored as{' '}
              <code className="rounded bg-muted px-1 py-0.5">{tableName || '…'}</code>
              <button
                type="button"
                className="rounded text-foreground underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? 'Hide' : 'Change'}
              </button>
            </p>
          </div>

          {showAdvanced && (
            <div className="flex flex-col gap-4 rounded-lg bg-muted/40 p-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="table-name">Storage name</Label>
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
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, digits and underscores. Can't be changed later.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="table-id-type">How rows are identified</Label>
                <Select value={idType} onValueChange={(value) => setIdType(value as IdType)}>
                  <SelectTrigger id="table-id-type" size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uuid">Random ID (default)</SelectItem>
                    <SelectItem value="auto_increment">Counting up from 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>What do you record about each one?</Label>
            {columns.map((col, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={i === 0 ? 'e.g. name' : 'e.g. price'}
                  value={col.name}
                  onChange={(e) => updateColumn(i, { name: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={col.type}
                  onValueChange={(value) => updateColumn(i, { type: value as ColumnType })}
                >
                  <SelectTrigger size="sm" className="w-28" aria-label="Column type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                  </SelectContent>
                </Select>
                <span className="flex items-center gap-1.5">
                  <Checkbox
                    id={`column-required-${i}`}
                    checked={col.required}
                    onCheckedChange={(checked) => updateColumn(i, { required: checked === true })}
                  />
                  <Label htmlFor={`column-required-${i}`} className="text-xs font-normal text-muted-foreground">
                    Required
                  </Label>
                </span>
                <Button
                  type="button"
                  variant="destructive-ghost"
                  size="icon-sm"
                  onClick={() => setColumns(columns.filter((_, j) => j !== i))}
                  disabled={columns.length === 1}
                  aria-label={`Remove ${col.name || 'this column'}`}
                >
                  <Trash2Icon />
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
              <PlusIcon /> Add another
            </Button>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
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
