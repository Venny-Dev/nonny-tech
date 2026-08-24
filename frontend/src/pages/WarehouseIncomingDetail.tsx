import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useWarehouseIncomingById, useUpdateWarehouseEntry, useDeleteWarehouseEntry } from '../hooks/useWarehouseIncoming'
import type { WarehouseSerialNumberEntry } from '../services/warehouseIncomingService'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import WarehouseRestockModal from '../components/WarehouseRestockModal'
import WarehouseAddSerialModal from '../components/WarehouseAddSerialModal'
import TransferModal from '../components/TransferModal'

function ConditionBadges({ condition }: { condition: string[] }) {
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
        <span
          key={c}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-surface-container text-on-surface-variant border border-outline-variant/30"
        >
          {c}
        </span>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: 'available' | 'transferred' | 'sold' }) {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        Available
      </span>
    )
  }
  if (status === 'transferred') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
        Transferred to Shop
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
      Sold
    </span>
  )
}

function ReturnHistoryBadge({ history }: { history: { reason: string; returnedAt: string; returnedBy: { firstName?: string; lastName?: string; email: string } }[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!history || history.length === 0) return null

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-900 transition-colors"
      >
        <Icon name={expanded ? 'expand_less' : 'expand_more'} size={14} />
        Returned to warehouse
      </button>
      {expanded && (
        <div className="mt-1.5 ml-4 border-l-2 border-violet-200 pl-3 space-y-2">
          {history.map((h, i) => {
            const userName = h.returnedBy?.firstName
              ? `${h.returnedBy.firstName} ${h.returnedBy.lastName ?? ''}`.trim()
              : h.returnedBy?.email ?? '—'
            return (
              <div key={i} className="text-xs">
                <p className="text-on-surface font-medium">{h.reason}</p>
                <p className="text-on-surface-variant">
                  by {userName} · {new Date(h.returnedAt).toLocaleString('en-NG', {
                    month: 'short', day: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: WarehouseSerialNumberEntry
  onEdit: (entry: WarehouseSerialNumberEntry) => void
  onDelete: (entry: WarehouseSerialNumberEntry) => void
}) {
  const isAvailable = entry.status === 'available'
  const hasReturnHistory = entry.returnHistory && entry.returnHistory.length > 0

  return (
    <>
      <tr className="hover:bg-surface-container-low/40 transition-colors">
        <td className="px-5 py-3 font-mono text-xs text-on-surface">{entry.serialNumber}</td>
        <td className="px-5 py-3">
          <ConditionBadges condition={entry.condition} />
        </td>
        <td className="px-5 py-3">
          <StatusBadge status={entry.status} />
        </td>
        <td className="px-5 py-3">
          {isAvailable && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(entry)}
                className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit entry"
              >
                <Icon name="edit" size={15} />
              </button>
              <button
                onClick={() => onDelete(entry)}
                className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                title="Delete entry"
              >
                <Icon name="delete" size={15} />
              </button>
            </div>
          )}
          {hasReturnHistory && (
            <ReturnHistoryBadge history={entry.returnHistory} />
          )}
        </td>
      </tr>
    </>
  )
}

export default function WarehouseIncomingDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const { record, isLoading } = useWarehouseIncomingById(id)
  const { updateEntry, isUpdating } = useUpdateWarehouseEntry()
  const { deleteEntry, isDeleting } = useDeleteWarehouseEntry()
  const [showRestock, setShowRestock] = useState(false)
  const [showFillSlots, setShowFillSlots] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [search, setSearch] = useState('')

  // Edit dialog state
  const [editingEntry, setEditingEntry] = useState<WarehouseSerialNumberEntry | null>(null)
  const [editSerialNumber, setEditSerialNumber] = useState('')
  const [editCondition, setEditCondition] = useState('')

  // Delete dialog state
  const [deletingEntry, setDeletingEntry] = useState<WarehouseSerialNumberEntry | null>(null)

  useEffect(() => {
    setSearch('')
  }, [id])

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center py-32 text-on-surface-variant gap-2">
        <Icon name="progress_activity" className="animate-spin" />
        Loading record...
      </div>
    )
  }

  if (!record) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          to="/warehouse-incoming"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
        >
          <Icon name="arrow_back" size={16} />
          Back to Warehouse Incoming
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <Icon name="move_to_inbox" size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-semibold">Record not found</p>
          <p className="text-sm mt-1">This stock record may have been deleted or doesn't exist.</p>
        </div>
      </div>
    )
  }

  const query = search.trim().toLowerCase()
  const filteredEntries = query
    ? record.serialNumberEntries.filter((e) => e.serialNumber.toLowerCase().includes(query))
    : record.serialNumberEntries

  const availableEntries = filteredEntries.filter((e) => e.status === 'available')
  const transferredEntries = filteredEntries.filter((e) => e.status === 'transferred')
  const soldEntries = filteredEntries.filter((e) => e.status === 'sold')

  function openEdit(entry: WarehouseSerialNumberEntry) {
    setEditingEntry(entry)
    setEditSerialNumber(entry.serialNumber)
    setEditCondition(entry.condition.join(', '))
  }

  function closeEdit() {
    setEditingEntry(null)
    setEditSerialNumber('')
    setEditCondition('')
  }

  function handleEditSave() {
    if (!editingEntry) return
    const conditionArray = editCondition
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    if (conditionArray.length === 0) {
      toast.error('Condition cannot be empty')
      return
    }

    updateEntry(
      {
        recordId: record!._id,
        serialNumber: editingEntry.serialNumber,
        data: {
          serialNumber: editSerialNumber.trim() || undefined,
          condition: conditionArray,
        },
      },
      {
        onSuccess: () => {
          toast.success('Entry updated')
          closeEdit()
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to update entry')
        },
      },
    )
  }

  function openDelete(entry: WarehouseSerialNumberEntry) {
    setDeletingEntry(entry)
  }

  function closeDelete() {
    setDeletingEntry(null)
  }

  function handleDeleteConfirm() {
    if (!deletingEntry) return
    deleteEntry(
      { recordId: record!._id, serialNumber: deletingEntry.serialNumber },
      {
        onSuccess: () => {
          toast.success(`Entry ${deletingEntry.serialNumber} deleted`)
          closeDelete()
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to delete entry')
        },
      },
    )
  }

  const isBusy = isUpdating || isDeleting

  return (
    <div className="p-6 lg:p-8">
      <Link
        to="/warehouse-incoming"
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
      >
        <Icon name="arrow_back" size={16} />
        Back to Warehouse Incoming
      </Link>

      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
            {record.modelNumber}
          </h1>
          <p className="text-on-surface-variant mt-1">
            {record.processor} · {record.ram} · {record.storage}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowFillSlots(true)}
            disabled={record.pendingSlots <= 0}
            title={
              record.pendingSlots > 0
                ? `Fill ${record.pendingSlots} pending slot${record.pendingSlots !== 1 ? 's' : ''}`
                : 'No pending slots to fill'
            }
            className="flex items-center gap-2 border border-primary/40 text-primary px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="edit" size={16} />
            Fill Slots
            {record.pendingSlots > 0 && (
              <span className="bg-primary text-on-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
                {record.pendingSlots}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowRestock(true)}
            className="flex items-center gap-2 border border-outline-variant/40 text-on-surface px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-surface-container transition-all"
          >
            <Icon name="add_circle" size={16} />
            Restock
          </button>
          <button
            onClick={() => setShowTransfer(true)}
            disabled={record.availableCount === 0}
            title={
              record.availableCount > 0
                ? 'Send units to the shop'
                : 'No available units to transfer'
            }
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="hub" size={16} />
            Transfer to Shop
          </button>
        </div>
      </div>

      {/* Spec card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/40">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="inventory_2" className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">Specifications</p>
            <p className="text-xs text-on-surface-variant">Warehouse stock record details</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-y divide-outline-variant/10">
          {[
            { icon: 'laptop', label: 'Model', value: record.modelNumber },
            { icon: 'memory', label: 'Processor', value: record.processor },
            { icon: 'storage', label: 'RAM', value: record.ram },
            { icon: 'hard_drive', label: 'Storage', value: record.storage },
            { icon: 'power', label: 'Chargers', value: record.chargerQuantity > 0 ? String(record.chargerQuantity) : 'None' },
            { icon: 'deployed_code', label: 'Total Units', value: String(record.quantity) },
            { icon: 'check_circle', label: 'Available', value: String(record.availableCount) },
            { icon: 'hub', label: 'Transferred', value: String(record.transferredCount) },
            { icon: 'sell', label: 'Sold', value: String(record.soldCount) },
            { icon: 'pending', label: 'Pending Slots', value: String(record.pendingSlots) },
          ].map((item) => (
            <div key={item.label} className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Icon name={item.icon} size={16} className="text-on-surface-variant" />
                <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
              <p className="font-semibold text-on-surface text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Serial entries table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/40">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-tertiary-container flex items-center justify-center shrink-0">
              <Icon name="list_alt" className="text-on-tertiary-container" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-on-surface">Serial Number Entries</p>
              <p className="text-xs text-on-surface-variant">
                {record.serialNumberEntries.length} of {record.quantity} units recorded
                {query && filteredEntries.length !== record.serialNumberEntries.length && (
                  <span className="ml-1">· {filteredEntries.length} matching</span>
                )}
              </p>
            </div>
          </div>
          <div className="relative sm:w-64 shrink-0">
            <Icon
              name="search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Search serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/40 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label="Clear search"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {record.serialNumberEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Icon name="format_list_numbered" size={36} className="mb-2 opacity-30" />
              <p>No serial numbers recorded yet.</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Icon name="search_off" size={36} className="mb-2 opacity-30" />
              <p>No serial numbers match "{search.trim()}".</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-low/40">
                  <th className="px-5 py-3">Serial No.</th>
                  <th className="px-5 py-3">Condition</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {availableEntries.map((entry) => (
                  <EntryRow
                    key={entry._id}
                    entry={entry}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ))}
                {transferredEntries.length > 0 && (
                  <>
                    <tr className="bg-blue-50/50">
                      <td
                        colSpan={4}
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-700"
                      >
                        Transferred to Shop — {transferredEntries.length} unit{transferredEntries.length !== 1 ? 's' : ''}
                      </td>
                    </tr>
                    {transferredEntries.map((entry) => (
                      <EntryRow
                        key={entry._id}
                        entry={entry}
                        onEdit={openEdit}
                        onDelete={openDelete}
                      />
                    ))}
                  </>
                )}
                {soldEntries.length > 0 && (
                  <>
                    <tr className="bg-surface-container-low/60">
                      <td
                        colSpan={4}
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                      >
                        Sold — {soldEntries.length} unit{soldEntries.length !== 1 ? 's' : ''}
                      </td>
                    </tr>
                    {soldEntries.map((entry) => (
                      <EntryRow
                        key={entry._id}
                        entry={entry}
                        onEdit={openEdit}
                        onDelete={openDelete}
                      />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {record && (
        <WarehouseAddSerialModal
          open={showFillSlots}
          onClose={() => setShowFillSlots(false)}
          recordId={record._id}
          pendingSlots={record.pendingSlots}
        />
      )}

      {record && (
        <WarehouseRestockModal
          open={showRestock}
          onClose={() => setShowRestock(false)}
          record={record}
        />
      )}

      {record && (
        <TransferModal
          open={showTransfer}
          onClose={() => setShowTransfer(false)}
          record={record}
        />
      )}

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(v) => !v && !isBusy && closeEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Serial Number Entry</DialogTitle>
            <DialogDescription>
              Edit the serial number or condition for this available unit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1.5">
                Serial Number
              </label>
              <input
                type="text"
                value={editSerialNumber}
                onChange={(e) => setEditSerialNumber(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1.5">
                Condition <span className="text-on-surface-variant/60">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={editCondition}
                onChange={(e) => setEditCondition(e.target.value)}
                placeholder="e.g. ok, scratch on lid"
                className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeEdit} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={isBusy}>
              {isBusy ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Entry Confirmation Dialog */}
      <Dialog open={!!deletingEntry} onOpenChange={(v) => !v && !isBusy && closeDelete()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Serial Number Entry?</DialogTitle>
            <DialogDescription>
              This will permanently remove serial number{' '}
              <span className="font-mono font-medium text-on-surface">{deletingEntry?.serialNumber}</span>{' '}
              from this record and reduce the unit count by 1.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDelete} disabled={isBusy}>
              Go back
            </Button>
            <Button
              className="bg-error text-on-error hover:bg-error/90"
              disabled={isBusy}
              onClick={handleDeleteConfirm}
            >
              {isBusy ? 'Deleting...' : 'Delete Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
