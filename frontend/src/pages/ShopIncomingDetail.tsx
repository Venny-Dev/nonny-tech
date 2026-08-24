import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useShopIncomingById } from '../hooks/useShopIncoming'
import { useSalesBySerialNumber } from '../hooks/useSales'
import { useAuth } from '../contexts/AuthContext'
import type { ISerialNumberEntry } from '../services/shopIncomingService'
import { Icon } from '../components/ui/Icon'
import AddSerialModal from '../components/AddSerialModal'
import ReturnToWarehouseModal from '../components/ReturnToWarehouseModal'

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

function StatusBadge({ status }: { status: 'available' | 'sold' | 'transferred' }) {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        Available
      </span>
    )
  }
  if (status === 'transferred') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700">
        Returned to Warehouse
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
      Sold
    </span>
  )
}

function EntryRow({ entry }: { entry: ISerialNumberEntry }) {
  const { sales } = useSalesBySerialNumber(entry.serialNumber)
  const sale = sales[0] ?? null

  return (
    <tr className="hover:bg-surface-container-low/40 transition-colors">
      <td className="px-5 py-3 font-mono text-xs text-on-surface">{entry.serialNumber}</td>
      <td className="px-5 py-3">
        <ConditionBadges condition={entry.condition} />
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={entry.status} />
      </td>
      <td className="px-5 py-3 text-xs text-on-surface-variant">
        {entry.dateSold ? new Date(entry.dateSold).toLocaleDateString('en-NG', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }) : '—'}
      </td>
      <td className="px-5 py-3 text-xs text-on-surface-variant">
        {entry.status === 'sold' && sale
          ? <span className="font-semibold text-on-surface">₦{sale.price.toLocaleString()}</span>
          : '—'}
      </td>
    </tr>
  )
}

export default function ShopIncomingDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { record, isLoading } = useShopIncomingById(id)
  const [showFillSlots, setShowFillSlots] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [search, setSearch] = useState('')

  const sortedEntries = record
    ? [...record.serialNumberEntries].sort((a, b) => {
        // Available first, sold entries pushed to the bottom
        if (a.status !== b.status) return a.status === 'available' ? -1 : 1
        return 0
      })
    : []

  const query = search.trim().toLowerCase()
  const filteredEntries = query
    ? sortedEntries.filter((e) => e.serialNumber.toLowerCase().includes(query))
    : sortedEntries

  const availableEntries = filteredEntries.filter((e) => e.status === 'available')
  const soldEntries = filteredEntries.filter((e) => e.status === 'sold')
  const transferredEntries = filteredEntries.filter((e) => e.status === 'transferred')

  // Reset the search box when navigating to a different record
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
          to="/shop-incoming"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
        >
          <Icon name="arrow_back" size={16} />
          Back to Shop Incoming
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <Icon name="move_to_inbox" size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-semibold">Record not found</p>
          <p className="text-sm mt-1">This stock record may have been deleted or doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Back link */}
      <Link
        to="/shop-incoming"
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
      >            <Icon name="arrow_back" size={16} />
        Back to Shop Incoming
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
          {(user?.role === 'shop' || user?.role === 'admin') && (
            <button
              onClick={() => setShowReturn(true)}
              disabled={availableEntries.length === 0}
              title={
                availableEntries.length > 0
                  ? 'Send units back to the warehouse'
                  : 'No available units to return'
              }
              className="flex items-center gap-2 border border-violet-400 text-violet-700 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-violet-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="replay" size={16} />
              Return to Warehouse
            </button>
          )}
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
            <p className="text-xs text-on-surface-variant">Stock record details</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0 divide-x divide-y divide-outline-variant/10">
          {[
            { icon: 'laptop', label: 'Model', value: record.modelNumber },
            { icon: 'memory', label: 'Processor', value: record.processor },
            { icon: 'storage', label: 'RAM', value: record.ram },
            { icon: 'hard_drive', label: 'Storage', value: record.storage },
            {
              icon: 'power',
              label: 'Chargers',
              value: record.chargerQuantity > 0 ? String(record.chargerQuantity) : 'None',
            },
            { icon: 'deployed_code', label: 'Total Units', value: String(record.quantity) },
            {
              icon: 'check_circle',
              label: 'Filled',
              value: String(record.filledCount),
            },
            {
              icon: 'pending',
              label: 'Pending Slots',
              value: String(record.pendingSlots),
            },
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
              <p>No serial numbers match “{search.trim()}”.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-low/40">
                  <th className="px-5 py-3">Serial No.</th>
                  <th className="px-5 py-3">Condition</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date Sold</th>
                  <th className="px-5 py-3">Sale Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {availableEntries.map((entry) => (
                  <EntryRow key={entry._id} entry={entry} />
                ))}
                {transferredEntries.length > 0 && (
                  <>
                    <tr className="bg-violet-50/50">
                      <td
                        colSpan={5}
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-violet-700"
                      >
                        Returned to Warehouse — {transferredEntries.length} unit{transferredEntries.length !== 1 ? 's' : ''}
                      </td>
                    </tr>
                    {transferredEntries.map((entry) => (
                      <EntryRow key={entry._id} entry={entry} />
                    ))}
                  </>
                )}
                {soldEntries.length > 0 && (availableEntries.length > 0 || transferredEntries.length > 0) && (
                  <tr className="bg-surface-container-low/60">
                    <td
                      colSpan={5}
                      className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    >
                      Sold — {soldEntries.length} unit{soldEntries.length !== 1 ? 's' : ''}
                    </td>
                  </tr>
                )}
                {soldEntries.map((entry) => (
                  <EntryRow key={entry._id} entry={entry} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {record && (
        <AddSerialModal
          open={showFillSlots}
          onClose={() => setShowFillSlots(false)}
          recordId={record._id}
          pendingSlots={record.pendingSlots}
        />
      )}

      {record && (
        <ReturnToWarehouseModal
          open={showReturn}
          onClose={() => setShowReturn(false)}
          record={record}
        />
      )}

    </div>
  )
}
