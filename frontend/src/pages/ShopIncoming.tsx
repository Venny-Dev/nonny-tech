import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useShopIncoming, useDeleteShopIncoming } from '../hooks/useShopIncoming'
import ShopIncomingModal from '../components/ShopIncomingModal'
import AddSerialModal from '../components/AddSerialModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ShopIncomingRecord } from '../services/shopIncomingService'

export default function ShopIncoming() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [fillSlotsRecord, setFillSlotsRecord] = useState<ShopIncomingRecord | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const { records, isLoading } = useShopIncoming()
  const { deleteRecord, isDeleting } = useDeleteShopIncoming()

  const filtered = records.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.modelNumber.toLowerCase().includes(q) ||
      r.processor.toLowerCase().includes(q) ||
      r.ram.toLowerCase().includes(q) ||
      r.storage.toLowerCase().includes(q)
    )
  })

  const totalRecords = records.length
  const totalUnits = records.reduce((sum, r) => sum + r.quantity, 0)
  const totalPendingSlots = records.reduce((sum, r) => sum + r.pendingSlots, 0)
  const totalAvailable = records.reduce((sum, r) => sum + r.availableCount, 0)

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
            Shop Incoming
          </h1>
          <p className="text-on-surface-variant mt-1">
            Manage and track your incoming laptop stock.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-[1.02] transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: 'inventory_2',
            label: 'Total Records',
            value: totalRecords,
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
          },
          {
            icon: 'deployed_code',
            label: 'Total Units',
            value: totalUnits,
            iconBg: 'bg-tertiary-container',
            iconColor: 'text-on-tertiary-container',
          },
          {
            icon: 'pending',
            label: 'Pending Slots',
            value: totalPendingSlots,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
          },
          {
            icon: 'check_circle',
            label: 'Available Units',
            value: totalAvailable,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface-container-lowest p-5 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          >
            <div
              className={`w-10 h-10 rounded-lg ${s.iconBg} flex items-center justify-center mb-3`}
            >
              <span className={`material-symbols-outlined ${s.iconColor}`}>{s.icon}</span>
            </div>
            <p className="text-on-surface-variant text-xs font-medium mb-1">{s.label}</p>
            <p className="font-headline text-2xl font-bold text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-5 border-b border-outline-variant/20">
          <div className="relative w-full sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Model, processor, RAM, storage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant gap-2">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Loading records...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20 bg-surface-container-low/40">
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Processor</th>
                  <th className="px-5 py-3 hidden lg:table-cell">RAM</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Storage</th>
                  <th className="px-5 py-3 hidden md:table-cell">Charger</th>
                  <th className="px-5 py-3 text-center">Units</th>
                  <th className="px-5 py-3">Pending</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((record) => {
                  const isExpanded = expandedIds.has(record._id)
                  return (
                    <>
                      <tr
                        key={record._id}
                        onClick={() => navigate(`/shop-incoming/${record._id}`)}
                        className="hover:bg-surface-container-low/60 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-on-surface leading-tight">
                            {record.modelNumber}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant hidden sm:table-cell max-w-[160px] truncate">
                          {record.processor}
                        </td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant hidden lg:table-cell whitespace-nowrap">
                          {record.ram}
                        </td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant hidden lg:table-cell whitespace-nowrap">
                          {record.storage}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {record.chargerQuantity > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                              <span className="material-symbols-outlined text-sm">check</span>
                              {record.chargerQuantity}
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant">None</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-on-surface bg-surface-container-low">
                            {record.filledCount} / {record.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {record.pendingSlots > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                              {record.pendingSlots}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {record.pendingSlots > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setFillSlotsRecord(record) }}
                                className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
                                title="Fill pending slots"
                              >
                                Fill Slots
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setPendingDeleteId(record._id) }}
                              className="text-on-surface-variant hover:text-error transition-colors ml-1"
                              title="Delete record"
                            >
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleExpand(record._id) }}
                              className="text-on-surface-variant hover:text-on-surface transition-colors"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              <span className="material-symbols-outlined text-xl">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable sub-table */}
                      {isExpanded && (
                        <tr key={`${record._id}-expanded`}>
                          <td colSpan={8} className="px-5 pb-4 pt-0 bg-surface-container-low/30">
                            {record.serialNumberEntries.length === 0 ? (
                              <p className="text-xs text-on-surface-variant py-3 pl-2">
                                No serial numbers recorded yet.
                              </p>
                            ) : (
                              <div className="rounded-xl border border-outline-variant/20 overflow-hidden mt-1">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-left font-semibold text-on-surface-variant uppercase tracking-wider bg-surface-container-low/60 border-b border-outline-variant/20">
                                      <th className="px-4 py-2">Serial No.</th>
                                      <th className="px-4 py-2">Condition</th>
                                      <th className="px-4 py-2">Status</th>
                                      <th className="px-4 py-2">Date Sold</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-outline-variant/10">
                                    {record.serialNumberEntries.map((entry) => (
                                      <tr
                                        key={entry._id}
                                        className="hover:bg-surface-container-low/40 transition-colors"
                                      >
                                        <td className="px-4 py-2 font-mono text-on-surface">
                                          {entry.serialNumber}
                                        </td>
                                        <td className="px-4 py-2">
                                          <ConditionDisplay condition={entry.condition} />
                                        </td>
                                        <td className="px-4 py-2">
                                          <StatusBadge status={entry.status} />
                                        </td>
                                        <td className="px-4 py-2 text-on-surface-variant">
                                          {entry.dateSold
                                            ? new Date(entry.dateSold).toLocaleDateString()
                                            : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">
                        move_to_inbox
                      </span>
                      {search
                        ? 'No records match your search.'
                        : 'No shop incoming records yet. Add your first batch.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center px-5 py-4 border-t border-outline-variant/20 text-xs text-on-surface-variant">
          <span>
            Showing {filtered.length} of {records.length} records
          </span>
        </div>
      </div>

      <ShopIncomingModal open={showModal} onClose={() => setShowModal(false)} />

      {fillSlotsRecord && (
        <AddSerialModal
          open={!!fillSlotsRecord}
          onClose={() => setFillSlotsRecord(null)}
          recordId={fillSlotsRecord._id}
          pendingSlots={fillSlotsRecord.pendingSlots}
        />
      )}

      <Dialog
        open={!!pendingDeleteId}
        onOpenChange={(v) => !v && !isDeleting && setPendingDeleteId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this record?</DialogTitle>
            <DialogDescription>
              This will permanently remove the shop incoming record and all its serial number
              entries. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-error text-on-error hover:bg-error/90"
              disabled={isDeleting}
              onClick={() => {
                if (pendingDeleteId) {
                  deleteRecord(pendingDeleteId, {
                    onSuccess: () => {
                      setPendingDeleteId(null)
                      toast.success('Record deleted successfully')
                    },
                    onError: () => toast.error('Failed to delete record'),
                  })
                }
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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

function StatusBadge({ status }: { status: 'available' | 'sold' }) {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        Available
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
      Sold
    </span>
  )
}
