import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSaleById, useUpdateSaleStatus } from '../hooks/useSales'
import type { PaymentStatus } from '../services/salesService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const paymentBadge: Record<PaymentStatus, string> = {
  pending: 'text-blue-700 bg-blue-50',
  paid: 'text-emerald-700 bg-emerald-50',
  returned: 'text-amber-700 bg-amber-50',
}

function ConditionBadges({ condition }: { condition: string[] }) {
  if (condition.length === 1 && condition[0].toLowerCase() === 'ok') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        OK
      </span>
    )
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {condition.map((c) => (
        <span
          key={c}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-surface-container text-on-surface-variant border border-outline-variant/30"
        >
          {c}
        </span>
      ))}
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-outline-variant/10 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant sm:w-40 shrink-0">
        {label}
      </span>
      <div className="text-sm text-on-surface">{children}</div>
    </div>
  )
}

export default function SaleDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const { sale, isLoading, isError } = useSaleById(id)
  const { updateStatus, isUpdating } = useUpdateSaleStatus()
  const [editingStatus, setEditingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | null>(null)

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center py-32 text-on-surface-variant gap-2">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading sale...
      </div>
    )
  }

  if (isError || !sale) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Sales
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 opacity-30">receipt_long</span>
          <p className="text-lg font-semibold">Sale not found</p>
          <p className="text-sm mt-1">This sale record may have been deleted or doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Back link */}
      <Link
        to="/sales"
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to Sales
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
          Sale Detail
        </h1>
        <p className="text-on-surface-variant mt-1">
          {sale.modelNumber} — {sale.serialNumber}
        </p>
      </div>

      {/* Detail card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/40">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
          </div>
          <div>
            <p className="font-semibold text-on-surface">{sale.customerName}</p>
            <p className="text-xs text-on-surface-variant">{formatDate(sale.soldAt)}</p>
          </div>
          <div className="ml-auto">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${paymentBadge[sale.paymentStatus]}`}
            >
              {sale.paymentStatus}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 py-2">
          <DetailRow label="Customer">
            <span className="font-medium">{sale.customerName}</span>
          </DetailRow>

          <DetailRow label="Model Number">
            <span className="font-mono">{sale.modelNumber}</span>
          </DetailRow>

          <DetailRow label="Serial Number">
            <span className="font-mono">{sale.serialNumber}</span>
          </DetailRow>

          <DetailRow label="Processor">
            {sale.processor}
          </DetailRow>

          <DetailRow label="RAM">
            {sale.ram}
          </DetailRow>

          <DetailRow label="Storage">
            {sale.storage}
          </DetailRow>

          <DetailRow label="Condition">
            <ConditionBadges condition={sale.condition} />
          </DetailRow>

          <DetailRow label="Price">
            <span className="font-semibold text-on-surface">
              ₦{sale.price.toLocaleString()}
            </span>
          </DetailRow>

          <DetailRow label="Charger Qty">
            {sale.chargerQuantity > 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <span className="material-symbols-outlined text-sm">check</span>
                {sale.chargerQuantity}
              </span>
            ) : (
              <span className="text-on-surface-variant">None</span>
            )}
          </DetailRow>

          <DetailRow label="Payment Status">
            {editingStatus ? (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedStatus ?? sale.paymentStatus}
                  onValueChange={(v) => setSelectedStatus(v as PaymentStatus)}
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8 text-xs px-3"
                  disabled={isUpdating || !selectedStatus || selectedStatus === sale.paymentStatus}
                  onClick={() => {
                    if (!selectedStatus || selectedStatus === sale.paymentStatus) return
                    updateStatus(
                      { id: sale._id, paymentStatus: selectedStatus },
                      {
                        onSuccess: () => {
                          toast.success('Status updated')
                          setEditingStatus(false)
                          setSelectedStatus(null)
                        },
                        onError: () => toast.error('Failed to update status'),
                      },
                    )
                  }}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-3"
                  disabled={isUpdating}
                  onClick={() => { setEditingStatus(false); setSelectedStatus(null) }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${paymentBadge[sale.paymentStatus]}`}>
                  {sale.paymentStatus}
                </span>
                <button
                  onClick={() => { setEditingStatus(true); setSelectedStatus(sale.paymentStatus) }}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                  title="Edit status"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
              </div>
            )}
          </DetailRow>

          <DetailRow label="Date Sold">
            {formatDate(sale.soldAt)}
          </DetailRow>

          {sale.inventoryItem && (
            <DetailRow label="Stock Record">
              <Link
                to={`/shop-incoming/${sale.inventoryItem}`}
                className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline text-sm"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                View Stock Record
              </Link>
            </DetailRow>
          )}
        </div>
      </div>
    </div>
  )
}
