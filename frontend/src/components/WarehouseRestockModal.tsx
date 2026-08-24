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
import { useRestockWarehouseIncoming } from '../hooks/useWarehouseIncoming'
import type { WarehouseIncomingRecord } from '../services/warehouseIncomingService'

interface Props {
  open: boolean
  onClose: () => void
  record: WarehouseIncomingRecord
}

interface EntryRow {
  serialNumber: string
  condition: string
}

const inputCls =
  'w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
const errorCls = 'text-xs text-error mt-1'

const emptyRow = (): EntryRow => ({ serialNumber: '', condition: '' })

export default function WarehouseRestockModal({ open, onClose, record }: Props) {
  const { restockRecord, isRestocking } = useRestockWarehouseIncoming()
  const [additionalQuantity, setAdditionalQuantity] = useState('')
  const [entries, setEntries] = useState<EntryRow[]>([])
  const [errors, setErrors] = useState<string | null>(null)

  const rawQty = additionalQuantity.trim()
  const qty = parseInt(rawQty, 10) || 0

  function handleQuantityChange(value: string) {
    setAdditionalQuantity(value)
    setErrors(null)
    const newQty = parseInt(value, 10) || 0
    if (entries.length > newQty) {
      setEntries((prev) => prev.slice(0, newQty))
    }
  }

  function handleRowChange(index: number, field: keyof EntryRow, value: string) {
    setEntries((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
    setErrors(null)
  }

  function addRow() {
    if (entries.length >= qty) return
    setEntries((prev) => [...prev, emptyRow()])
  }

  function removeRow(index: number) {
    if (entries.length <= 1) return
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  function reset() {
    setAdditionalQuantity('')
    setEntries([])
    setErrors(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!/^\d+$/.test(rawQty) || qty < 1) {
      setErrors('Additional quantity must be a whole number of at least 1')
      return
    }

    const hasEmpty = entries.some((r) => !r.serialNumber.trim())
    if (hasEmpty) {
      setErrors('All serial number fields are required')
      return
    }

    const serialNumberEntries = entries.map((row) => {
      const parts = row.condition
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return {
        serialNumber: row.serialNumber.trim(),
        condition: parts.length > 0 ? parts : ['ok'],
      }
    })

    restockRecord(
      {
        id: record._id,
        data: {
          additionalQuantity: qty,
          serialNumberEntries: serialNumberEntries.length > 0 ? serialNumberEntries : undefined,
        },
      },
      {
        onSuccess: () => {
          reset()
          onClose()
          toast.success('Warehouse restock successful')
        },
        onError: (error) => {
          toast.error(
            error instanceof Error && error.message ? error.message : 'Failed to restock',
          )
        },
      },
    )
  }

  const canAddRow = qty >= 1 && entries.length < qty

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isRestocking && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Warehouse Restock — {record.modelNumber}</DialogTitle>
          <DialogDescription>
            {record.processor} · {record.ram} · {record.storage}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
          {/* Additional Quantity */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wr-additionalQuantity">Additional Quantity</Label>
            <input
              id="wr-additionalQuantity"
              type="number"
              min={1}
              placeholder="e.g. 5"
              className={inputCls}
              value={additionalQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
            />
            {errors && qty < 1 && <p className={errorCls}>{errors}</p>}
          </div>

          {/* Serial Number Entries */}
          {qty >= 1 && (
            <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Serial Numbers
                  <span className="ml-1 text-xs font-normal text-on-surface-variant">
                    ({entries.length}/{qty})
                  </span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  disabled={!canAddRow}
                >
                  + Add Serial Number
                </Button>
              </div>

              {entries.length === 0 && (
                <p className="text-xs text-on-surface-variant">
                  Optional — add serial numbers for the new units, or leave blank to restock
                  without recording them yet.
                </p>
              )}

              {entries.map((row, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 flex flex-col gap-1">
                    <Label
                      htmlFor={`wr-serial-${i}`}
                      className="text-xs font-medium text-on-surface-variant"
                    >
                      Serial Number
                    </Label>
                    <input
                      id={`wr-serial-${i}`}
                      placeholder="e.g. 5CG1234ABCD"
                      className={inputCls}
                      value={row.serialNumber}
                      onChange={(e) => handleRowChange(i, 'serialNumber', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <Label
                      htmlFor={`wr-condition-${i}`}
                      className="text-xs font-medium text-on-surface-variant"
                    >
                      Laptop Condition
                    </Label>
                    <input
                      id={`wr-condition-${i}`}
                      placeholder="e.g. ok, cracked hinge, missing key"
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
                    disabled={entries.length <= 1}
                    className="mt-0.5 shrink-0 text-on-surface-variant hover:text-error"
                  >
                    ×
                  </Button>
                </div>
              ))}

              {errors && <p className={errorCls}>{errors}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isRestocking}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isRestocking || qty < 1}>
              {isRestocking ? (
                <>
                  <Icon name="progress_activity" className="animate-spin" />
                  Restocking...
                </>
              ) : (
                'Restock'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
