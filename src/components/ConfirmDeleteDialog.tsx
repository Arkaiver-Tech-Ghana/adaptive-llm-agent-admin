import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isConfirmationRequired, type ConfirmationRequired, type DeleteResult } from '@/lib/api'

// Mirrors the Tool Rail's Confirmation Request pattern: the first DELETE
// call returns a confirm_token instead of deleting anything, the second
// call (with that token echoed back) actually executes it.
interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestDelete: (confirmToken?: string) => Promise<ConfirmationRequired | DeleteResult>
  onDeleted: () => void
}

export function ConfirmDeleteDialog({ open, onOpenChange, requestDelete, onDeleted }: ConfirmDeleteDialogProps) {
  const [pending, setPending] = useState<ConfirmationRequired | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const result = await requestDelete()
      if (isConfirmationRequired(result)) {
        setPending(result)
      } else {
        onDeleted()
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      await requestDelete(pending.confirm_token)
      onDeleted()
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setPending(null)
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pending ? 'Confirm deletion' : 'Delete this?'}</DialogTitle>
          <DialogDescription>
            {pending ? pending.description : 'This can’t be undone.'}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          {pending ? (
            <Button variant="destructive" onClick={confirm} disabled={busy}>
              Yes, delete
            </Button>
          ) : (
            <Button variant="destructive" onClick={start} disabled={busy}>
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
