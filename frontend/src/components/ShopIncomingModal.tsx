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
import { useCreateShopIncoming } from '../hooks/useShopIncoming'

interface Props {
  open: boolean
  onClose: () => void
}

interface EntryRow {
  serialNumber: string
  condition: string
}

interface FormState {
  modelNumber: string
  processor: string
  ram: string
  storage: string
  quantity: string
  chargerQuantity: string
}

const inputCls =
  'w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
const errorCls = 'text-xs text-error mt-1'

const defaultForm: FormState = {
  modelNumber: '',
  processor: '',
  ram: '',
  storage: '',
  quantity: '1',
  chargerQuantity: '0',
}

export default function ShopIncomingModal({ open, onClose }: Props) {
  const { createRecord, isCreating } = useCreateShopIncoming()
  const [form, setForm] = useState<FormState>(defaultForm)
  const [entries, setEntries] = useState<EntryRow[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'entries', string>>>({})

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleEntryChange(index: number, field: keyof EntryRow, value: string) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }

  function addEntry() {
    const qty = parseInt(form.quantity, 10) || 1
    if (entries.length >= qty) return
    setEntries((prev) => [...prev, { serialNumber: '', condition: '' }])
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.modelNumber.trim()) newErrors.modelNumber = 'Required'
    if (!form.processor.trim()) newErrors.processor = 'Required'
    if (!form.ram.trim()) newErrors.ram = 'Required'
    if (!form.storage.trim()) newErrors.storage = 'Required'
    const qty = parseInt(form.quantity, 10)
    if (!form.quantity || isNaN(qty) || qty < 1) newErrors.quantity = 'Min 1'
    const chargerQty = parseInt(form.chargerQuantity, 10)
    if (form.chargerQuantity !== '' && (isNaN(chargerQty) || chargerQty < 0))
      newErrors.chargerQuantity = 'Min 0'
    for (const entry of entries) {
      if (!entry.serialNumber.trim()) {
        newErrors.entries = 'All serial number fields are required'
        break
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const serialNumberEntries = entries.map((entry) => {
      const parts = entry.condition
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return {
        serialNumber: entry.serialNumber.trim(),
        condition: parts.length > 0 ? parts : ['ok'],
      }
    })

    createRecord(
      {
        modelNumber: form.modelNumber.trim(),
        processor: form.processor.trim(),
        ram: form.ram.trim(),
        storage: form.storage.trim(),
        quantity: parseInt(form.quantity, 10),
        chargerQuantity: parseInt(form.chargerQuantity, 10) || 0,
        serialNumberEntries: serialNumberEntries.length > 0 ? serialNumberEntries : undefined,
      },
      {
        onSuccess: () => {
          setForm(defaultForm)
          setEntries([])
          setErrors({})
          onClose()
          toast.success('Shop incoming record created')
        },
        onError: () => {
          toast.error('Failed to create record')
        },
      },
    )
  }

  const maxEntries = parseInt(form.quantity, 10) || 1

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Shop Incoming</DialogTitle>
          <DialogDescription>Record a new batch of incoming stock.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
          {/* Model Number */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="si-modelNumber">Model Number</Label>
            <input
              id="si-modelNumber"
              placeholder="e.g. XPS-9500"
              className={inputCls}
              value={form.modelNumber}
              onChange={(e) => handleChange('modelNumber', e.target.value)}
            />
            {errors.modelNumber && <p className={errorCls}>{errors.modelNumber}</p>}
          </div>

          {/* Processor */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="si-processor">Processor</Label>
            <input
              id="si-processor"
              placeholder="e.g. Intel Core i7-10750H"
              className={inputCls}
              value={form.processor}
              onChange={(e) => handleChange('processor', e.target.value)}
            />
            {errors.processor && <p className={errorCls}>{errors.processor}</p>}
          </div>

          {/* RAM + Storage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-ram">RAM</Label>
              <input
                id="si-ram"
                placeholder="e.g. 16GB"
                className={inputCls}
                value={form.ram}
                onChange={(e) => handleChange('ram', e.target.value)}
              />
              {errors.ram && <p className={errorCls}>{errors.ram}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-storage">Storage</Label>
              <input
                id="si-storage"
                placeholder="e.g. 512GB SSD"
                className={inputCls}
                value={form.storage}
                onChange={(e) => handleChange('storage', e.target.value)}
              />
              {errors.storage && <p className={errorCls}>{errors.storage}</p>}
            </div>
          </div>

          {/* Quantity + Charger Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-quantity">Quantity</Label>
              <input
                id="si-quantity"
                type="number"
                min={1}
                className={inputCls}
                value={form.quantity}
                onChange={(e) => {
                  handleChange('quantity', e.target.value)
                  // trim entries if new qty is lower
                  const newQty = parseInt(e.target.value, 10) || 1
                  if (entries.length > newQty) {
                    setEntries((prev) => prev.slice(0, newQty))
                  }
                }}
              />
              {errors.quantity && <p className={errorCls}>{errors.quantity}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-chargerQuantity">Charger Qty (optional)</Label>
              <input
                id="si-chargerQuantity"
                type="number"
                min={0}
                className={inputCls}
                value={form.chargerQuantity}
                onChange={(e) => handleChange('chargerQuantity', e.target.value)}
              />
              {errors.chargerQuantity && <p className={errorCls}>{errors.chargerQuantity}</p>}
            </div>
          </div>

          {/* Serial Number Entries */}
          <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Serial Numbers
                <span className="ml-1 text-xs font-normal text-on-surface-variant">
                  ({entries.length}/{maxEntries})
                </span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEntry}
                disabled={entries.length >= maxEntries}
              >
                + Add unit
              </Button>
            </div>

            {entries.length === 0 && (
              <p className="text-xs text-on-surface-variant">
                No serial numbers added. Click "Add unit" to record individual units.
              </p>
            )}

            {entries.map((entry, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    placeholder="Serial number"
                    className={inputCls}
                    value={entry.serialNumber}
                    onChange={(e) => handleEntryChange(i, 'serialNumber', e.target.value)}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    placeholder="e.g. cracked hinge, missing key"
                    className={inputCls}
                    value={entry.condition}
                    onChange={(e) => handleEntryChange(i, 'condition', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeEntry(i)}
                  className="mt-0.5 shrink-0 text-on-surface-variant hover:text-error"
                >
                  ×
                </Button>
              </div>
            ))}

            {errors.entries && <p className={errorCls}>{errors.entries}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isCreating}>
              {isCreating ? 'Saving...' : 'Create Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
