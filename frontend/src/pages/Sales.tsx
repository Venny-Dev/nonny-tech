import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import RecordSaleModal from '../components/RecordSaleModal'
import { useSales, useDeleteSale } from '../hooks/useSales'
import type { PaymentStatus, Sale } from '../services/salesService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type DateFilter = 'all' | 'today' | 'week'

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000
const OLDER_PAGE_SIZE = 7 // days per "load more" chunk
// Computed once at module load time — outside any component, so it's pure
const PAGE_LOAD_TIME = new Date().getTime()

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function formatDayLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (dayKey(iso) === dayKey(now.toISOString())) return 'Today'
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Yesterday'
  return d.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function isToday(iso: string) {
  return dayKey(iso) === dayKey(new Date().toISOString())
}

function isThisWeek(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  return d >= weekAgo && d <= now
}

const paymentBadge: Record<PaymentStatus, string> = {
  pending: 'text-blue-700 bg-blue-50',
  paid: 'text-emerald-700 bg-emerald-50',
  returned: 'text-amber-700 bg-amber-50',
}

function groupByDay(sales: Sale[]): { label: string; date: string; sales: Sale[] }[] {
  const map = new Map<string, Sale[]>()
  for (const sale of sales) {
    const key = dayKey(sale.soldAt)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(sale)
  }
  return Array.from(map.entries()).map(([, daySales]) => ({
    label: formatDayLabel(daySales[0].soldAt),
    date: daySales[0].soldAt,
    sales: daySales,
  }))
}

function DayGroup({
  group,
  navigate,
  setPendingDeleteId,
}: {
  group: { label: string; date: string; sales: Sale[] }
  navigate: (path: string) => void
  setPendingDeleteId: (id: string) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-headline font-bold text-sm text-on-surface">{group.label}</span>
        <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
          {group.sales.length} sale{group.sales.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1 h-px bg-outline-variant/20" />
        <span className="text-xs font-semibold text-on-surface-variant">
          ₦{group.sales.reduce((sum, s) => sum + s.price, 0).toLocaleString()}
        </span>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-low/40">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Laptop</th>
                <th className="px-5 py-3 hidden sm:table-cell">Serial No.</th>
                <th className="px-5 py-3 hidden lg:table-cell">RAM / Storage</th>
                <th className="px-5 py-3 hidden md:table-cell text-right">Price</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 hidden sm:table-cell">Time</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {group.sales.map((sale) => (
                <tr
                  key={sale._id}
                  onClick={() => navigate(`/sales/${sale._id}`)}
                  className="group hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4 text-xs text-on-surface-variant">
                    {sale.customerName}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-on-surface leading-tight">{sale.modelNumber}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{sale.processor}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant hidden sm:table-cell">
                    {sale.serialNumber}
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant hidden lg:table-cell whitespace-nowrap">
                    {sale.ram} · {sale.storage}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-on-surface hidden md:table-cell whitespace-nowrap">
                    ₦{sale.price.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${paymentBadge[sale.paymentStatus]}`}>
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant hidden sm:table-cell whitespace-nowrap">
                    {formatTime(sale.soldAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingDeleteId(sale._id) }}
                      className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-all"
                      title="Delete sale"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Sales() {
  const navigate = useNavigate()
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [olderDaysVisible, setOlderDaysVisible] = useState(OLDER_PAGE_SIZE)

  const { sales, isLoading } = useSales()
  const { deleteSale, isDeleting } = useDeleteSale()

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        (s.serialNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.modelNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.customerName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.processor ?? '').toLowerCase().includes(search.toLowerCase())

      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && isToday(s.soldAt)) ||
        (dateFilter === 'week' && isThisWeek(s.soldAt))

      const matchesStatus = statusFilter === 'all' || s.paymentStatus === statusFilter

      return matchesSearch && matchesDate && matchesStatus
    })
  }, [sales, search, dateFilter, statusFilter])

  const grouped = useMemo(() => groupByDay(filtered), [filtered])

  // Split into recent (≤14 days) and older groups
  const recentGroups = grouped.filter((g) => PAGE_LOAD_TIME - new Date(g.date).getTime() <= TWO_WEEKS_MS)
  const olderGroups = grouped.filter((g) => PAGE_LOAD_TIME - new Date(g.date).getTime() > TWO_WEEKS_MS)
  const visibleOlderGroups = olderGroups.slice(0, olderDaysVisible)
  const hasMoreOlder = olderGroups.length > olderDaysVisible

  const totalSales = sales.length
  const pendingCount = sales.filter((s) => s.paymentStatus === 'pending').length
  const paidCount = sales.filter((s) => s.paymentStatus === 'paid').length
  const returnedCount = sales.filter((s) => s.paymentStatus === 'returned').length
  const todayCount = sales.filter((s) => isToday(s.soldAt)).length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-1">
            Sales Ledger
          </h1>
          <p className="text-on-surface-variant">Review and manage your transaction history.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { icon: 'shopping_bag', label: 'Total Sales', value: totalSales, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
          { icon: 'today', label: 'Today', value: todayCount, iconBg: 'bg-tertiary-container', iconColor: 'text-on-tertiary-container' },
          { icon: 'schedule', label: 'Pending', value: pendingCount, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { icon: 'check_circle', label: 'Paid', value: paidCount, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { icon: 'undo', label: 'Returned', value: returnedCount, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className={`w-10 h-10 rounded-lg ${s.iconBg} flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined ${s.iconColor}`}>{s.icon}</span>
            </div>
            <p className="text-on-surface-variant text-xs font-medium mb-1">{s.label}</p>
            <p className="font-headline text-2xl font-bold text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
            <input
              type="text"
              placeholder="Customer, serial, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant/20 p-1 rounded-xl shrink-0">
            {([['all', 'All'], ['today', 'Today'], ['week', 'This Week']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setDateFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateFilter === val ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant/20 p-1 rounded-xl shrink-0">
            {([['all', 'All'], ['pending', 'Pending'], ['paid', 'Paid'], ['returned', 'Returned']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === val ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-[1.02] transition-all self-start sm:self-auto shrink-0"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Record Sale
        </button>
      </div>

      {/* Grouped sales */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-on-surface-variant gap-2">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading sales...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">receipt_long</span>
          {search || dateFilter !== 'all' || statusFilter !== 'all'
            ? 'No sales match your filters.'
            : 'No sales recorded yet.'}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Recent groups (within 2 weeks) */}
          {recentGroups.map((group) => (
            <DayGroup
              key={group.label}
              group={group}
              navigate={navigate}
              setPendingDeleteId={setPendingDeleteId}
            />
          ))}

          {/* Older groups with pagination */}
          {olderGroups.length > 0 && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-outline-variant/20" />
                <span className="text-xs font-semibold text-on-surface-variant px-2 py-1 bg-surface-container rounded-full">
                  Older than 2 weeks — {olderGroups.length} day{olderGroups.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 h-px bg-outline-variant/20" />
              </div>

              {visibleOlderGroups.map((group) => (
                <DayGroup
                  key={group.label}
                  group={group}
                  navigate={navigate}
                  setPendingDeleteId={setPendingDeleteId}
                />
              ))}

              {hasMoreOlder && (
                <button
                  onClick={() => setOlderDaysVisible((v) => v + OLDER_PAGE_SIZE)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all"
                >
                  <span className="material-symbols-outlined text-base">expand_more</span>
                  Load {Math.min(OLDER_PAGE_SIZE, olderGroups.length - olderDaysVisible)} more day{Math.min(OLDER_PAGE_SIZE, olderGroups.length - olderDaysVisible) !== 1 ? 's' : ''}
                </button>
              )}

              {!hasMoreOlder && visibleOlderGroups.length > 0 && (
                <p className="text-xs text-on-surface-variant text-center">All older sales loaded</p>
              )}
            </>
          )}

          <p className="text-xs text-on-surface-variant text-center pb-2">
            Showing {filtered.length} of {sales.length} sales
            {(dateFilter !== 'all' || statusFilter !== 'all') && (
              <button onClick={() => { setDateFilter('all'); setStatusFilter('all') }} className="ml-2 text-primary font-medium hover:underline">
                Clear filters
              </button>
            )}
          </p>
        </div>
      )}

      <RecordSaleModal open={showModal} onClose={() => setShowModal(false)} />

      <Dialog open={!!pendingDeleteId} onOpenChange={(v) => !v && !isDeleting && setPendingDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this sale?</DialogTitle>
            <DialogDescription>
              This will permanently remove the sale record. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPendingDeleteId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              className="bg-error text-on-error hover:bg-error/90"
              disabled={isDeleting}
              onClick={() => {
                if (pendingDeleteId) {
                  deleteSale(pendingDeleteId, {
                    onSuccess: () => { setPendingDeleteId(null); toast.success('Sale deleted') },
                    onError: () => toast.error('Failed to delete sale'),
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
