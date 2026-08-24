import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import SerialTypeahead from './SerialTypeahead'
import { useCreateSale } from '../hooks/useSales'
import type { TypeaheadResult } from '../services/shopIncomingService'
import type { CreateSaleInput, PaymentStatus } from '../services/salesService'

interface Props {
  open: boolean
  onClose: () => void
  source?: 'shop' | 'warehouse'
}

interface UnitRow {
  serialValue: string
  result: TypeaheadResult | null
  ram: string
  storage: string
  originalRam: string
  originalStorage: string
  price: number
}

function SourceBadge({ source }: { source?: 'shop' | 'warehouse' }) {
  if (!source) return null
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
        source === 'warehouse' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {source === 'warehouse' ? 'Warehouse' : 'Shop'}
    </span>
  )
}

const inputCls =
  'w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

function ConditionDisplay({ condition }: { condition: string[] }) {
  if (condition.length === 1 && condition[0].toLowerCase() === 'ok') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        OK
      </span>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {condition.map((c) => (
        <span key={c} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-surface-container text-on-surface-variant border border-outline-variant/30">
          {c}
        </span>
      ))}
    </div>
  )
}

function specKey(r: TypeaheadResult) {
  return `${r.modelNumber}|${r.processor}|${r.ram}|${r.storage}`
}

function hasMismatch(units: UnitRow[]): boolean {
  const resolved = units.filter((u) => u.result)
  if (resolved.length < 2) return false
  const first = specKey(resolved[0].result!)
  return resolved.some((u) => specKey(u.result!) !== first)
}

export default function RecordSaleModal({ open, onClose, source }: Props) {
  const [units, setUnits] = useState<UnitRow[]>([{ serialValue: '', result: null, ram: '', storage: '', originalRam: '', originalStorage: '', price: 0 }])
  const [chargerQuantity, setChargerQuantity] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')
  const [customerName, setCustomerName] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingPayloads, setPendingPayloads] = useState<CreateSaleInput[]>([])

  const { recordSale, isRecording } = useCreateSale()

  const quantity = units.length

  function updateUnit(index: number, patch: Partial<UnitRow>) {
    setUnits((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)))
  }

  function addUnit() {
    setUnits((prev) => [...prev, { serialValue: '', result: null, ram: '', storage: '', originalRam: '', originalStorage: '', price: 0 }])
  }

  function removeUnit(index: number) {
    if (units.length === 1) return
    setUnits((prev) => prev.filter((_, i) => i !== index))
  }

  function handleReset() {
    setUnits([{ serialValue: '', result: null, ram: '', storage: '', originalRam: '', originalStorage: '', price: 0 }])
    setChargerQuantity(0)
    setPaymentStatus('pending')
    setCustomerName('')
    setShowConfirm(false)
    setPendingPayloads([])
  }

  function handleClose() {
    handleReset()
    onClose()
  }

  function buildPayloads(): CreateSaleInput[] {
    return units
      .filter((u) => u.result)
      .map((u) => {
        const source = u.result!.source ?? 'shop'
        const payload: CreateSaleInput = {
          serialNumber: u.result!.serialNumber,
          modelNumber: u.result!.modelNumber,
          processor: u.result!.processor,
          ram: u.ram,
          storage: u.storage,
          chargerQuantity,
          condition: u.result!.condition,
          price: u.price,
          paymentStatus,
          source,
          customerName,
        }
        if (source === 'warehouse') {
          payload.warehouseRecord = u.result!.parentId
        } else {
          payload.inventoryItem = u.result!.parentId
        }
        return payload
      })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const resolved = units.filter((u) => u.result)
    if (resolved.length === 0) return

    const payloads = buildPayloads()

    if (hasMismatch(units)) {
      setPendingPayloads(payloads)
      setShowConfirm(true)
      return
    }

    submitAll(payloads)
  }

  function submitAll(payloads: CreateSaleInput[]) {
    let completed = 0
    let failed = 0

    payloads.forEach((payload) => {
      recordSale(payload, {
        onSuccess: () => {
          completed++
          if (completed + failed === payloads.length) {
            if (failed === 0) {
              toast.success(`${completed} sale${completed > 1 ? 's' : ''} recorded`)
              handleClose()
            } else {
              toast.error(`${completed} recorded, ${failed} failed`)
            }
          }
        },
        onError: () => {
          failed++
          if (completed + failed === payloads.length) {
            toast.error(`${completed} recorded, ${failed} failed`)
          }
        },
      })
    })
  }

  const allResolved = units.every((u) => u.result !== null)
  const mismatch = hasMismatch(units)

  // Check if any unit has RAM or Storage changed but the new value is empty
  const hasEmptyOverrides = units.some((u) => u.result && (
    (u.ram !== u.originalRam && !u.ram.trim()) ||
    (u.storage !== u.originalStorage && !u.storage.trim())
  ))

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>
              Search serial numbers to auto-fill device details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {/* Units */}
            <div className="flex flex-col gap-3">
              {units.map((unit, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-container p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                      Unit {i + 1}
                    </Label>
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(i)}
                        className="text-xs text-on-surface-variant hover:text-error transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <SerialTypeahead
                    value={unit.serialValue}
                    onChange={(v) => updateUnit(i, { serialValue: v, result: v ? unit.result : null })}
                    onSelect={(r) => updateUnit(i, { serialValue: r.serialNumber, result: r, ram: r.ram, storage: r.storage, originalRam: r.ram, originalStorage: r.storage })}
                    onClear={() => updateUnit(i, { serialValue: '', result: null, ram: '', storage: '', originalRam: '', originalStorage: '', price: 0 })}
                    source={source}
                  />
                  {unit.result && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <SourceBadge source={unit.result.source} />
                      {[unit.result.modelNumber, unit.result.processor, unit.result.ram, unit.result.storage].map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                          {s}
                        </span>
                      ))}
                      <ConditionDisplay condition={unit.result.condition} />
                    </div>
                  )}
                  {unit.result && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-on-surface-variant">
                          RAM {unit.ram !== unit.originalRam && unit.originalRam && (
                            <span className="text-amber-600">(recorded: {unit.originalRam})</span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={unit.ram}
                            onChange={(e) => updateUnit(i, { ram: e.target.value })}
                            placeholder={unit.originalRam}
                            className={`${inputCls} ${unit.ram !== unit.originalRam ? 'border-amber-400 bg-amber-50/50' : ''}`}
                          />
                          {unit.ram !== unit.originalRam && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-amber-600 font-medium">Changed</span>
                          )}
                        </div>
                        {unit.ram !== unit.originalRam && unit.originalRam && (
                          <p className="text-[11px] text-amber-600 leading-tight">
                            This laptop was recorded with {unit.originalRam} RAM. Enter the RAM it is being sold with.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-on-surface-variant">
                          Storage {unit.storage !== unit.originalStorage && unit.originalStorage && (
                            <span className="text-amber-600">(recorded: {unit.originalStorage})</span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={unit.storage}
                            onChange={(e) => updateUnit(i, { storage: e.target.value })}
                            placeholder={unit.originalStorage}
                            className={`${inputCls} ${unit.storage !== unit.originalStorage ? 'border-amber-400 bg-amber-50/50' : ''}`}
                          />
                          {unit.storage !== unit.originalStorage && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-amber-600 font-medium">Changed</span>
                          )}
                        </div>
                        {unit.storage !== unit.originalStorage && unit.originalStorage && (
                          <p className="text-[11px] text-amber-600 leading-tight">
                            This laptop was recorded with {unit.originalStorage} storage. Enter the storage it is being sold with.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {unit.result && (
                    <div className="flex flex-col gap-1 mt-1">
                      <label className="text-xs text-on-surface-variant">Price (₦)</label>
                      <input
                        type="number"
                        min={0}
                        value={unit.price}
                        onChange={(e) => updateUnit(i, { price: Math.max(0, Number(e.target.value)) })}
                        required
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                  )}
                  {mismatch && unit.result && i > 0 && specKey(unit.result) !== specKey(units[0].result!) && (
                    <p className="text-xs text-amber-600 mt-0.5">⚠ Different specs from unit 1</p>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addUnit}
                className="text-sm text-primary font-medium hover:underline self-start"
              >
                + Add another unit
              </button>
            </div>

            {/* Customer Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customerName">Customer Name</Label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className={inputCls}
              />
            </div>

            {/* Chargers + Payment */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="chargerQty">Chargers</Label>
                <input
                  id="chargerQty"
                  type="number"
                  min={0}
                  value={chargerQuantity}
                  onChange={(e) => setChargerQuantity(Math.max(0, Number(e.target.value)))}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Payment</Label>
                <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mismatch && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Some units have different specs. You'll be asked to confirm before recording.
              </p>
            )}

            {hasEmptyOverrides && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                You changed RAM or Storage from the recorded values — please enter the new values before recording.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isRecording || !allResolved || hasEmptyOverrides}>
                {isRecording ? 'Recording...' : `Record ${quantity > 1 ? `${quantity} Sales` : 'Sale'}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mismatch confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={(v) => !v && setShowConfirm(false)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Mixed Sale</DialogTitle>
            <DialogDescription>
              The units you're recording have different specs. Please review before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 my-2">
            {pendingPayloads.map((p, i) => (
              <div key={i} className="rounded-lg border border-outline-variant/20 bg-surface-container p-3 text-sm">
                <p className="font-semibold text-on-surface mb-1">Unit {i + 1} — {p.serialNumber}</p>
                <div className="flex flex-wrap gap-1">
                  {[p.modelNumber, p.processor, p.ram, p.storage].map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Price: ₦{p.price.toLocaleString()} · Chargers: {p.chargerQuantity} · {p.paymentStatus}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Go back
            </Button>
            <Button
              disabled={isRecording}
              onClick={() => {
                setShowConfirm(false)
                submitAll(pendingPayloads)
              }}
            >
              {isRecording ? 'Recording...' : 'Confirm & Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
