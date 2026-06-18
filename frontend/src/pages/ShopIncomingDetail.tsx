import { Link, useParams } from 'react-router-dom'
import { useShopIncomingById } from '../hooks/useShopIncoming'
import { useSalesBySerialNumber } from '../hooks/useSales'
import type { ISerialNumberEntry } from '../services/shopIncomingService'

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
  const { record, isLoading } = useShopIncomingById(id)

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center py-32 text-on-surface-variant gap-2">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
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
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Shop Incoming
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 opacity-30">move_to_inbox</span>
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
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to Shop Incoming
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
          {record.modelNumber}
        </h1>
        <p className="text-on-surface-variant mt-1">
          {record.processor} · {record.ram} · {record.storage}
        </p>
      </div>

      {/* Spec card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/40">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">inventory_2</span>
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
                <span className="material-symbols-outlined text-on-surface-variant text-base">
                  {item.icon}
                </span>
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
        <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/40">
          <div className="w-10 h-10 rounded-lg bg-tertiary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-tertiary-container">list_alt</span>
          </div>
          <div>
            <p className="font-semibold text-on-surface">Serial Number Entries</p>
            <p className="text-xs text-on-surface-variant">
              {record.serialNumberEntries.length} of {record.quantity} units recorded
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {record.serialNumberEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">
                format_list_numbered
              </span>
              <p>No serial numbers recorded yet.</p>
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
                {record.serialNumberEntries.map((entry) => (
                  <EntryRow key={entry._id} entry={entry} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
