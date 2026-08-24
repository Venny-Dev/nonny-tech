import { useState } from 'react'
import { toast } from 'sonner'
import { useTransfers, useApproveTransfer, useRejectTransfer, useCancelTransfer } from '../hooks/useTransfers'
import type { TransferDateFilter } from '../services/transferService'
import { useAuth } from '../contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'
import type { TransferRequest, TransferStatus } from '../services/transferService'

type DatePreset = 'all' | 'today' | 'week' | 'two_weeks' | 'month' | 'custom'

function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string): TransferDateFilter {
  if (preset === 'custom') {
    return { dateFrom: customFrom || undefined, dateTo: customTo || undefined }
  }
  if (preset === 'all') return {}

  const now = new Date()
  const start = new Date()

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'two_weeks':
      start.setDate(now.getDate() - 14)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
  }

  const formatDate = (d: Date) => d.toISOString().slice(0, 10)
  return { dateFrom: formatDate(start), dateTo: formatDate(now) }
}

const datePresets: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'two_weeks', label: 'Last 2 Weeks' },
  { value: 'month', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
]

const statusBadge: Record<TransferStatus, string> = {
  pending: 'text-amber-700 bg-amber-50',
  approved: 'text-emerald-700 bg-emerald-50',
  rejected: 'text-red-700 bg-red-50',
  cancelled: 'text-on-surface-variant bg-surface-container',
}

function TransferDirectionBadge({ direction }: { direction: string }) {
  if (direction === 'shop_to_warehouse') {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
        ↩ Shop → Warehouse
      </span>
    )
  }
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
        → Warehouse → Shop
      </span>
  )
}

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TransferRow({
  transfer,
  onAction,
  role,
}: {
  transfer: TransferRequest
  onAction: (id: string, action: 'approve' | 'reject' | 'cancel') => void
  role?: string
}) {
  const record = typeof transfer.warehouseRecordId === 'string' ? null : transfer.warehouseRecordId
  const warehouseRecord = typeof transfer.warehouseRecordId === 'string' ? null : transfer.warehouseRecordId
  const shopRecord = typeof transfer.shopRecordId === 'string' ? null : transfer.shopRecordId
  const sourceRecord = warehouseRecord ?? shopRecord
  const specs = sourceRecord
    ? `${sourceRecord.modelNumber} · ${sourceRecord.processor}`
    : transfer.entries[0]
      ? `${transfer.entries[0].modelNumber} · ${transfer.entries[0].processor}`
      : '—'

  const directionLabel = transfer.direction === 'shop_to_warehouse' ? 'Return to Warehouse' : 'Transfer to Shop'

  const isReturnToWarehouse = transfer.direction === 'shop_to_warehouse'
  const canApprove = isReturnToWarehouse
    ? role === 'admin' || role === 'warehouse'
    : role === 'admin' || role === 'shop'
  const canCancel = role === 'admin' || (isReturnToWarehouse ? role === 'shop' : role === 'warehouse')

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-on-surface text-sm">{specs}</p>
            <TransferDirectionBadge direction={transfer.direction} />
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusBadge[transfer.status]}`}>
              {transfer.status}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {transfer.count} unit{transfer.count !== 1 ? 's' : ''} · {directionLabel} · Requested by{' '}
            {transfer.requestedByName ?? '—'}
            {transfer.approvedByName ? ` · ${transfer.status === 'rejected' ? 'Rejected' : 'Handled'} by ${transfer.approvedByName}` : ''}
            {' '}· {formatDisplayDate(transfer.createdAt)}
          </p>
          {transfer.reason && (
            <p className="text-xs text-on-surface-variant mt-1">
              <span className="font-semibold">Reason:</span> {transfer.reason}
            </p>
          )}
          {transfer.note && (
            <p className="text-xs text-on-surface-variant mt-1 italic">"{transfer.note}"</p>
          )}
        </div>

        {transfer.status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            {canApprove && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(transfer._id, 'reject')}
                className="text-error border-error/30 hover:bg-error/5"
              >
                Reject
              </Button>
            )}
            {canApprove && (
              <Button size="sm" onClick={() => onAction(transfer._id, 'approve')}>
                Approve
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction(transfer._id, 'cancel')}
                title="Cancel request"
              >
                <Icon name="close" size={14} />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-outline-variant/10 px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          Units
        </p>
        <div className="flex flex-wrap gap-1.5">
          {transfer.entries.map((e) => (
            <span
              key={e.warehouseEntryId}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-surface-container border border-outline-variant/20"
            >
              <span className="font-medium text-on-surface">{e.modelNumber}</span>
              <span className="text-outline-variant/60">·</span>
              <span className="font-mono text-on-surface-variant">{e.serialNumber}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Transfers() {
  const { user } = useAuth()

  // Date filter state
  const [activePreset, setActivePreset] = useState<DatePreset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const dateFilter = getDateRange(activePreset, customFrom, customTo)
  const { transfers, isLoading } = useTransfers(
    Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
  )
  const { approveTransfer, isApproving } = useApproveTransfer()
  const { rejectTransfer, isRejecting } = useRejectTransfer()
  const { cancelTransfer, isCancelling } = useCancelTransfer()
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'approve' | 'reject' | 'cancel' } | null>(null)

  const pending = transfers.filter((t) => t.status === 'pending')
  const history = transfers.filter((t) => t.status !== 'pending')
  const isBusy = isApproving || isRejecting || isCancelling

  function confirmAction(id: string, action: 'approve' | 'reject' | 'cancel') {
    setPendingAction({ id, action })
  }

  function executeAction() {
    if (!pendingAction) return
    const { id, action } = pendingAction
    const callbacks = {
      onSuccess: () => {
        setPendingAction(null)
        toast.success(
          action === 'approve'
            ? 'Transfer approved — units moved to shop stock'
            : action === 'reject'
              ? 'Transfer rejected'
              : 'Transfer cancelled',
        )
      },
      onError: () => toast.error('Action failed. Please try again.'),
    }
    if (action === 'approve') approveTransfer(id, callbacks)
    else if (action === 'reject') rejectTransfer(id, callbacks)
    else cancelTransfer(id, callbacks)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-1">
          Transfers
        </h1>
        <p className="text-on-surface-variant">
          {user?.role === 'shop'
            ? 'Approve warehouse→shop transfers and return goods to the warehouse.'
            : user?.role === 'warehouse'
              ? 'Track your outgoing transfers and approve shop→warehouse returns.'
              : 'Monitor all warehouse ↔ shop stock movements.'}
        </p>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Icon name="calendar_today" size={16} className="text-on-surface-variant" />
          {datePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setActivePreset(preset.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                activePreset === preset.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {activePreset === 'custom' && (
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-on-surface-variant" htmlFor="dateFrom">From</label>
              <input
                id="dateFrom"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs border border-outline-variant/30 rounded-lg px-2.5 py-1.5 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-on-surface-variant" htmlFor="dateTo">To</label>
              <input
                id="dateTo"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs border border-outline-variant/30 rounded-lg px-2.5 py-1.5 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-on-surface-variant gap-2">
          <Icon name="progress_activity" className="animate-spin" />
          Loading transfers...
        </div>
      ) : transfers.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <Icon name="hub" size={36} className="block mb-2 opacity-30" />
          <p>No transfer requests found{activePreset !== 'all' ? ' for this date range' : ' yet'}.</p>
          {user?.role === 'warehouse' && activePreset === 'all' && (
            <p className="text-xs mt-1">
              Open a warehouse record and use "Transfer to Shop" to send units.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-headline font-bold text-sm text-on-surface">Pending Approval</span>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-2xl shadow-sm px-5 py-10 text-center">
                No pending transfers.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.map((t) => (
                  <TransferRow key={t._id} transfer={t} onAction={confirmAction} role={user?.role} />
                ))}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-headline font-bold text-sm text-on-surface">History</span>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
                <div className="flex-1 h-px bg-outline-variant/20" />
              </div>
              <div className="flex flex-col gap-4">
                {history.map((t) => (
                  <TransferRow key={t._id} transfer={t} onAction={confirmAction} role={user?.role} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!pendingAction}
        onOpenChange={(v) => !v && !isBusy && setPendingAction(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'approve'
                ? 'Approve this transfer?'
                : pendingAction?.action === 'reject'
                  ? 'Reject this transfer?'
                  : 'Cancel this transfer?'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.action === 'approve'
                ? 'The selected units will be moved from the warehouse into shop stock.'
                : pendingAction?.action === 'reject'
                  ? 'The units will remain available in the warehouse.'
                  : 'The units will remain available in the warehouse.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={isBusy}>
              Go back
            </Button>
            <Button
              className={
                pendingAction?.action === 'reject'
                  ? 'bg-error text-on-error hover:bg-error/90'
                  : undefined
              }
              disabled={isBusy}
              onClick={executeAction}
            >
              {isBusy ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
