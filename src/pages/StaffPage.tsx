import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useAuth } from '@/lib/auth'
import { api, type StaffUser } from '@/lib/api'

// Staff accounts have no email-invite flow (issue #17): the owner sets a
// username + temp password directly, and hands it to the staff member
// out-of-band. There's no "update" endpoint — a staff account is
// create/delete only.
export function StaffPage() {
  const { user } = useAuth()
  const businessId = user!.businessId!
  const token = user!.token

  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      setStaff(await api.listStaff(token, businessId))
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

  async function submitCreate(event: FormEvent) {
    event.preventDefault()
    try {
      await api.createStaff(token, businessId, email, password)
      toast.success('Staff account created')
      setCreating(false)
      setEmail('')
      setPassword('')
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Staff</h1>
        <Button onClick={() => setCreating(true)}>Add staff</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => (
            <TableRow key={s.email}>
              <TableCell>{s.email}</TableCell>
              <TableCell className="flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(s)}>
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && staff.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No staff accounts yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add staff account</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={submitCreate}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-password">Temporary password</Label>
              <Input
                id="staff-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          requestDelete={(confirmToken) =>
            api.deleteStaff(token, businessId, deleteTarget.email, confirmToken)
          }
          onDeleted={() => {
            toast.success('Staff account removed')
            refresh()
          }}
        />
      )}
    </div>
  )
}
