import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { useStockRequests, useCreateStockRequest, useRespondToStockRequest, useMarkStockRequestsAsSeen } from '../hooks/useStockRequests'
import type { StockRequest, StockRequestStatus } from '../services/stockRequestService'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const statusBadge: Record<StockRequestStatus, string> = {
  pending: 'text-amber-700 bg-amber-50',
  available: 'text-emerald-700 bg-emerald-50',
  unavailable: 'text-red-700 bg-red-50',
}

const inputCls =
  'w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RequestCard({
  request,
  role,
  onRespond,
}: {
  request: StockRequest
  role?: string
  onRespond: (request: StockRequest) => void
}) {
  const requesterName = request.requestedBy?.firstName
    ? `${request.requestedBy.firstName} ${request.requestedBy.lastName ?? ''}`.trim()
    : request.requestedBy?.email ?? '—'

  const responderName = request.respondedBy?.firstName
    ? `${request.respondedBy.firstName} ${request.respondedBy.lastName ?? ''}`.trim()
    : request.respondedBy?.email ?? null

  const canRespond = role === 'admin' || role === 'warehouse'

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-on-surface text-sm">{request.modelNumber}</p>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusBadge[request.status]}`}>
              {request.status}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Requested by {requesterName} · {formatDisplayDate(request.requestedAt)}
            {request.respondedAt && responderName
              ? ` · Responded by ${responderName} · ${formatDisplayDate(request.respondedAt)}`
              : ''}
          </p>
          {request.quantity && (
            <p className="text-xs text-on-surface-variant mt-1">
              <span className="font-semibold">Quantity needed:</span> {request.quantity}
            </p>
          )}
          {request.note && (
            <p className="text-xs text-on-surface-variant mt-1 italic">"{request.note}"</p>
          )}

          {/* Response details */}
          {request.status === 'available' && (
            <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-700">
                ✓ Available — {request.availableCount} unit{request.availableCount !== 1 ? 's' : ''} in stock
              </p>
              {request.responseNote && (
                <p className="text-xs text-emerald-600 mt-0.5">{request.responseNote}</p>
              )}
            </div>
          )}
          {request.status === 'unavailable' && (
            <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-xs font-semibold text-red-700">✗ Not available</p>
              {request.responseNote && (
                <p className="text-xs text-red-600 mt-0.5">{request.responseNote}</p>
              )}
            </div>
          )}
        </div>

        {request.status === 'pending' && canRespond && (
          <Button size="sm" onClick={() => onRespond(request)} className="shrink-0">
            Respond
          </Button>
        )}
      </div>
    </div>
  )
}

export default function StockRequests() {
  const { user } = useAuth()
  const { requests, isLoading } = useStockRequests()
  const { createRequest, isCreating } = useCreateStockRequest()
  const { respondToRequest, isResponding } = useRespondToStockRequest()
  const { markAsSeen } = useMarkStockRequestsAsSeen()

  const [showNewRequest, setShowNewRequest] = useState(false)
  const [respondingTo, setRespondingTo] = useState<StockRequest | null>(null)

  // New request form state
  const [modelNumber, setModelNumber] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  // Respond form state
  const [respondStatus, setRespondStatus] = useState<'available' | 'unavailable'>('available')
  const [availableCount, setAvailableCount] = useState('')
  const [responseNote, setResponseNote] = useState('')

  const isShop = user?.role === 'shop' || user?.role === 'admin'
  const isBusy = isCreating || isResponding

  const pending = requests.filter((r) => r.status === 'pending')
  const responded = requests.filter((r) => r.status !== 'pending')

  function resetNewRequestForm() {
    setModelNumber('')
    setQuantity('')
    setNote('')
  }

  function resetRespondForm() {
    setRespondStatus('available')
    setAvailableCount('')
    setResponseNote('')
  }

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!modelNumber.trim()) return

    createRequest(
      {
        modelNumber: modelNumber.trim(),
        quantity: quantity ? Number(quantity) : undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          resetNewRequestForm()
          setShowNewRequest(false)
          toast.success('Stock request submitted')
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to submit request')
        },
      },
    )
  }

  function handleRespondSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!respondingTo) return

    respondToRequest(
      {
        id: respondingTo._id,
        data: {
          status: respondStatus,
          availableCount: respondStatus === 'available' && availableCount ? Number(availableCount) : undefined,
          responseNote: responseNote.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          resetRespondForm()
          setRespondingTo(null)
          toast.success(
            respondStatus === 'available'
              ? 'Marked as available'
              : 'Marked as unavailable',
          )
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to respond')
        },
      },
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-1">
            Stock Requests
          </h1>
          <p className="text-on-surface-variant">
            {isShop
              ? 'Request laptop models from the warehouse and check availability.'
              : 'Respond to shop stock availability requests.'}
          </p>
        </div>
        {isShop && (
          <Button onClick={() => setShowNewRequest(true)} className="shrink-0">
            <Icon name="add" size={16} className="mr-1" />
            New Request
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-on-surface-variant gap-2">
          <Icon name="progress_activity" className="animate-spin" />
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <Icon name="help" size={36} className="block mb-2 opacity-30" />
          <p>No stock requests yet.</p>
          {isShop && (
            <p className="text-xs mt-1">Click "New Request" to ask about laptop availability.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Pending requests */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-headline font-bold text-sm text-on-surface">
                {isShop ? 'Awaiting Response' : 'Pending Requests'}
              </span>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-2xl shadow-sm px-5 py-10 text-center">
                No pending requests.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.map((r) => (
                  <RequestCard key={r._id} request={r} role={user?.role} onRespond={setRespondingTo} />
                ))}
              </div>
            )}
          </div>

          {/* Responded requests */}
          {responded.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-headline font-bold text-sm text-on-surface">Responded</span>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {responded.length}
                </span>
                <div className="flex-1 h-px bg-outline-variant/20" />
                {isShop && responded.some((r) => !r.seenByRequester) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsSeen()}
                    className="text-xs"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-4">
                {responded.map((r) => (
                  <RequestCard key={r._id} request={r} role={user?.role} onRespond={setRespondingTo} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Request Modal (shop only) */}
      <Dialog open={showNewRequest} onOpenChange={(v) => !v && !isBusy && (setShowNewRequest(false), resetNewRequestForm())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Stock Availability</DialogTitle>
            <DialogDescription>
              Ask the warehouse if a particular laptop model is available.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4 mt-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sr-model">
                Model Number <span className="text-error">*</span>
              </Label>
              <input
                id="sr-model"
                placeholder="e.g. MacBook Pro 2023, HP EliteBook 840"
                className={inputCls}
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sr-quantity">Quantity (optional)</Label>
              <input
                id="sr-quantity"
                type="number"
                min="1"
                placeholder="Leave blank to ask generally"
                className={inputCls}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sr-note">Note (optional)</Label>
              <input
                id="sr-note"
                placeholder="e.g. need for a bulk order next week"
                className={inputCls}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => { setShowNewRequest(false); resetNewRequestForm() }} disabled={isBusy}>
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy || !modelNumber.trim()}>
                {isBusy ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Respond Modal (warehouse/admin only) */}
      <Dialog open={!!respondingTo} onOpenChange={(v) => !v && !isBusy && (setRespondingTo(null), resetRespondForm())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Request</DialogTitle>
            <DialogDescription>
              Is <span className="font-semibold text-on-surface">{respondingTo?.modelNumber}</span> available in the warehouse?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRespondSubmit} className="flex flex-col gap-4 mt-1">
            <div className="flex flex-col gap-1.5">
              <Label>Availability</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRespondStatus('available')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-all ${
                    respondStatus === 'available'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-outline-variant/40 bg-surface-container text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  <Icon name="check_circle" size={18} />
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => setRespondStatus('unavailable')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-all ${
                    respondStatus === 'unavailable'
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-outline-variant/40 bg-surface-container text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  <Icon name="cancel" size={18} />
                  Not Available
                </button>
              </div>
            </div>

            {respondStatus === 'available' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sr-available-count">How many units available?</Label>
                <input
                  id="sr-available-count"
                  type="number"
                  min="1"
                  placeholder="e.g. 5"
                  className={inputCls}
                  value={availableCount}
                  onChange={(e) => setAvailableCount(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sr-response-note">
                {respondStatus === 'available' ? 'Note (optional)' : 'Reason (optional)'}
              </Label>
              <input
                id="sr-response-note"
                placeholder={
                  respondStatus === 'available'
                    ? 'e.g. all units are in good condition'
                    : 'e.g. all units are reserved, none in stock'
                }
                className={inputCls}
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => { setRespondingTo(null); resetRespondForm() }} disabled={isBusy}>
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? 'Submitting...' : 'Submit Response'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
