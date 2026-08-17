import { useEffect, useState, type ReactNode } from 'react'
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
//
// That handshake is a wire protocol, not a user flow. It used to be
// exposed literally — the owner clicked "Continue", then "Yes, delete",
// and in between read the backend's own token description ("Delete row
// '435fc1e1112f4d90add3346f03918a30' from hotel/room_types"). Now the
// unconfirmed call is fired as soon as the dialog opens, purely to fetch
// the token, and the owner sees one question in their own words with one
// button under it. Nothing is deleted until they press it.
interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What is being deleted, in the owner's words: "this room type", "the Rooms table". */
  what: string
  /** What it costs them. Ends the sentence the title starts. */
  consequence?: ReactNode
  confirmLabel?: string
  requestDelete: (confirmToken?: string) => Promise<ConfirmationRequired | DeleteResult>
  onDeleted: () => void
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  what,
  consequence,
  confirmLabel = 'Delete',
  requestDelete,
  onDeleted,
}: ConfirmDeleteDialogProps) {
  const [pending, setPending] = useState<ConfirmationRequired | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch the confirm token up front. This call deletes nothing — the
  // backend hands back a token and waits for it to be echoed.
  useEffect(() => {
    if (!open) {
      setPending(null)
      setError(null)
      return
    }
    let cancelled = false
    requestDelete()
      .then((result) => {
        if (cancelled) return
        if (isConfirmationRequired(result)) {
          setPending(result)
        } else {
          // Endpoint deleted without asking — nothing left to confirm.
          onDeleted()
          onOpenChange(false)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function confirm() {
    if (!pending || busy) return
    setBusy(true)
    setError(null)
    try {
      await requestDelete(pending.confirm_token)
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {what}?</DialogTitle>
          <DialogDescription>{consequence ?? 'This can’t be undone.'}</DialogDescription>
        </DialogHeader>
        {error && (
          <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy || !pending}>
            {busy ? 'Deleting…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
