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
import { Icon } from '@/components/ui/Icon'
import { useCreateTransfer } from '../hooks/useTransfers'
import type { ShopIncomingRecord } from '../services/shopIncomingService'

interface Props {
  open: boolean
  onClose: () => void
  record: ShopIncomingRecord
}

const inputCls =
  'w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

export default function ReturnToWarehouseModal({ open, onClose, record }: Props) {
  const { createTransfer, isCreating } = useCreateTransfer()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  const available = record.serialNumberEntries.filter((e) => e.status === 'available')

  function toggleSerial(serial: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(serial)) next.delete(serial)
      else next.add(serial)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === available.length) return new Set()
      return new Set(available.map((e) => e.serialNumber))
    })
  }

  function reset() {
    setSelected(new Set())
    setReason('')
    setNote('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.size === 0) return
    if (!reason.trim()) return

    createTransfer(
      {
        shopRecordId: record._id,
        serialNumbers: Array.from(selected),
        direction: 'shop_to_warehouse',
        reason: reason.trim(),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          reset()
          onClose()
          toast.success(
            `Return request sent for ${selected.size} unit${selected.size !== 1 ? 's' : ''} — awaiting warehouse approval`,
          )
        },
        onError: (error) => {
          toast.error(
            error instanceof Error && error.message ? error.message : 'Failed to create return request',
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isCreating && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Return to Warehouse — {record.modelNumber}</DialogTitle>
          <DialogDescription>
            Select available units to send back to the warehouse. The warehouse must approve before they move.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container p-3">
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {record.modelNumber}
                <span className="ml-2 text-xs font-normal text-on-surface-variant">
                  {record.processor} · {record.ram} · {record.storage}
                </span>
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {available.length} available · {selected.size} selected
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === available.length && available.length > 0 ? 'Clear' : 'Select all'}
            </Button>
          </div>

          {available.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant gap-2">
              <Icon name="warning" size={32} className="opacity-30" />
              <p className="text-sm">No available units to return.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
              {available.map((entry) => {
                const isChecked = selected.has(entry.serialNumber)
                return (
                  <label
                    key={entry._id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                      isChecked
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-outline-variant/30 bg-surface-container hover:border-outline-variant'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSerial(entry.serialNumber)}
                      className="accent-primary h-4 w-4"
                    />
                    <span className="font-mono text-xs text-on-surface">{entry.serialNumber}</span>
                    <span className="ml-auto text-xs text-on-surface-variant">
                      {entry.condition.join(', ')}
                    </span>
                  </label>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-reason">
              Reason <span className="text-error">*</span>
            </Label>
            <input
              id="return-reason"
              placeholder="e.g. defective units, customer returned, wrong model shipped"
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-note">Note (optional)</Label>
            <input
              id="return-note"
              placeholder="e.g. include original packaging"
              className={inputCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isCreating || selected.size === 0 || !reason.trim()}>
              {isCreating ? (
                <>
                  <Icon name="progress_activity" className="animate-spin" />
                  Sending...
                </>
              ) : (
                `Return ${selected.size > 0 ? `${selected.size} Unit${selected.size !== 1 ? 's' : ''}` : 'to Warehouse'}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
