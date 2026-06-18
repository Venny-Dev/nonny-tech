import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAddEntries } from '../hooks/useShopIncoming'

interface Props {
  open: boolean
  onClose: () => void
  recordId: string
  pendingSlots: number
}

interface EntryRow {
  serialNumber: string
  condition: string
}

const inputCls =
  'w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
const errorCls = 'text-xs text-error mt-1'

const emptyRow = (): EntryRow => ({ serialNumber: '', condition: '' })

export default function AddSerialModal({ open, onClose, recordId, pendingSlots }: Props) {
  const { addEntries, isAdding } = useAddEntries()
  const [rows, setRows] = useState<EntryRow[]>([emptyRow()])
  const [errors, setErrors] = useState<string | null>(null)

  function handleRowChange(index: number, field: keyof EntryRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
    setErrors(null)
  }

  function addRow() {
    if (rows.length >= pendingSlots) return
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  function reset() {
    setRows([emptyRow()])
    setErrors(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const hasEmpty = rows.some((r) => !r.serialNumber.trim())
    if (hasEmpty) {
      setErrors('All serial number fields are required')
      return
    }

    const entries = rows.map((row) => {
      const parts = row.condition
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return {
        serialNumber: row.serialNumber.trim(),
        condition: parts.length > 0 ? parts : ['ok'],
      }
    })

    addEntries(
      { id: recordId, entries },
      {
        onSuccess: () => {
          reset()
          onClose()
          toast.success('Serial numbers added')
        },
        onError: () => {
          toast.error('Failed to add serial numbers')
        },
      },
    )
  }

  const slotsRemaining = pendingSlots - rows.length

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Serial Numbers</DialogTitle>
          <DialogDescription>
            Fill in serial numbers for pending slots.{' '}
            <span className="font-medium text-on-surface">
              {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
          <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Entries
                <span className="ml-1 text-xs font-normal text-on-surface-variant">
                  ({rows.length}/{pendingSlots})
                </span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                disabled={rows.length >= pendingSlots}
              >
                + Add another
              </Button>
            </div>

            {rows.map((row, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    placeholder="Serial number"
                    className={inputCls}
                    value={row.serialNumber}
                    onChange={(e) => handleRowChange(i, 'serialNumber', e.target.value)}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    placeholder="e.g. cracked hinge, missing key"
                    className={inputCls}
                    value={row.condition}
                    onChange={(e) => handleRowChange(i, 'condition', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  className="mt-0.5 shrink-0 text-on-surface-variant hover:text-error"
                >
                  ×
                </Button>
              </div>
            ))}

            {errors && <p className={errorCls}>{errors}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isAdding}>
              {isAdding ? 'Saving...' : 'Add Serial Numbers'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
