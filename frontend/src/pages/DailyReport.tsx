import { useState } from 'react'
import { useDailyReport } from '../hooks/useAnalytics'
import { Icon } from '../components/ui/Icon'
import type { PaymentStatus, Sale, SaleSource } from '../services/salesService'
import type { DailyTransfer } from '../services/salesService'

const paymentBadge: Record<PaymentStatus, string> = {
  pending: 'text-blue-700 bg-blue-50',
  paid: 'text-emerald-700 bg-emerald-50',
  returned: 'text-amber-700 bg-amber-50',
}

const sourceBadge: Record<SaleSource, string> = {
  shop: 'bg-emerald-50 text-emerald-700',
  warehouse: 'bg-blue-50 text-blue-700',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

function userName(u?: { firstName?: string; lastName?: string; email: string } | null) {
  if (!u) return '—'
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return name || u.email
}

function TransfersSection({
  transfers,
  summary,
}: {
  transfers: DailyTransfer[]
  summary: { count: number; unitsMoved: number }
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
            <Icon name="hub" className="text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">Transfers Approved</p>
            <p className="text-xs text-on-surface-variant">
              {summary.count} transfer{summary.count !== 1 ? 's' : ''} · {summary.unitsMoved} unit{summary.unitsMoved !== 1 ? 's' : ''} moved
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-violet-50 text-violet-700">
          transfers
        </span>
      </div>

      {transfers.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-10">No transfers approved on this day.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-low/40">
                <th className="px-5 py-3">Units</th>
                <th className="px-5 py-3 hidden sm:table-cell">Models</th>
                <th className="px-5 py-3 hidden md:table-cell">Requested by</th>
                <th className="px-5 py-3 hidden md:table-cell">Approved by</th>
                <th className="px-5 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {transfers.map((t) => (
                <tr key={t._id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-50 text-violet-700 text-xs font-bold">
                      {t.entries.length}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {Array.from(new Set(t.entries.map((e) => e.modelNumber))).map((m) => (
                        <span key={m} className="text-xs text-on-surface leading-tight">{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant hidden md:table-cell">
                    {userName(t.requestedBy)}
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant hidden md:table-cell">
                    {userName(t.approvedBy)}
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                    {formatTime(t.respondedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function DailyReport() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const { report, isLoading } = useDailyReport(date)

  const prevDay = () => {
    const d = new Date(`${date}T12:00:00`)
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().slice(0, 10))
  }
  const nextDay = () => {
    const d = new Date(`${date}T12:00:00`)
    d.setDate(d.getDate() + 1)
    if (d.toISOString().slice(0, 10) > today) return
    setDate(d.toISOString().slice(0, 10))
  }

  const allSales = report?.sales ?? []

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-1">
            Daily Report
          </h1>
          <p className="text-on-surface-variant">
            Total sales for the day — shop and warehouse combined.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevDay}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-container transition-all"
          >
            <Icon name="chevron_left" size={16} />
          </button>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button
            onClick={nextDay}
            disabled={date >= today}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-container transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="chevron_right" size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32 text-on-surface-variant gap-2">
          <Icon name="progress_activity" className="animate-spin" />
          Loading report...
        </div>
      ) : !report ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <Icon name="receipt_long" size={36} className="block mb-2 opacity-30" />
          <p>No report available for this date.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: 'shopping_bag', label: 'Total Sales', value: report.total.count, color: 'text-primary bg-primary/10' },
              { icon: 'payments', label: 'Total Revenue', value: `₦${report.total.revenue.toLocaleString()}`, color: 'text-emerald-600 bg-emerald-50' },
              { icon: 'check_circle', label: 'Paid', value: report.total.paidCount, color: 'text-emerald-700 bg-emerald-50' },
              { icon: 'schedule', label: 'Pending', value: report.total.pendingCount, color: 'text-blue-600 bg-blue-50' },
              { icon: 'hub', label: 'Transfers', value: report.transferSummary?.count ?? 0, color: 'text-violet-600 bg-violet-50' },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <Icon name={s.icon} />
                </div>
                <p className="text-on-surface-variant text-xs font-medium mb-1">{s.label}</p>
                <p className="font-headline text-2xl font-bold text-on-surface">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Shop vs Warehouse split */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/60 rounded-xl p-5 border border-emerald-100">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Shop Sales</p>
              <p className="font-headline text-3xl font-bold text-on-surface">{report.shop.count}</p>
              <p className="text-sm text-on-surface-variant mt-1">
                ₦{report.shop.revenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">Warehouse Sales</p>
              <p className="font-headline text-3xl font-bold text-on-surface">{report.warehouse.count}</p>
              <p className="text-sm text-on-surface-variant mt-1">
                ₦{report.warehouse.revenue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Combined sales table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="receipt_long" className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">All Sales</p>
                  <p className="text-xs text-on-surface-variant">
                    {allSales.length} sale{allSales.length !== 1 ? 's' : ''} · ₦
                    {report.total.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {allSales.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-10">No sales on this day.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-low/40">
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Laptop</th>
                      <th className="px-5 py-3 hidden sm:table-cell">Serial No.</th>
                      <th className="px-5 py-3">Source</th>
                      <th className="px-5 py-3 hidden md:table-cell text-right">Price</th>
                      <th className="px-5 py-3">Payment</th>
                      <th className="px-5 py-3 hidden sm:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {allSales.map((sale: Sale) => {
                      const src = (sale.source ?? 'shop') as SaleSource
                      return (
                        <tr key={sale._id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-5 py-4 text-xs text-on-surface-variant">{sale.customerName}</td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-on-surface leading-tight">{sale.modelNumber}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{sale.processor}</p>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-on-surface-variant hidden sm:table-cell">
                            {sale.serialNumber}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${sourceBadge[src]}`}>
                              {src}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-on-surface hidden md:table-cell whitespace-nowrap">
                            ₦{sale.price.toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${paymentBadge[sale.paymentStatus as PaymentStatus]}`}>
                              {sale.paymentStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-on-surface-variant hidden sm:table-cell whitespace-nowrap">
                            {formatTime(sale.soldAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <TransfersSection
            transfers={report.transfers ?? []}
            summary={report.transferSummary ?? { count: 0, unitsMoved: 0 }}
          />
        </div>
      )}
    </div>
  )
}
