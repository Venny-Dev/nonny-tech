import { useDashboard } from '../hooks/useAnalytics'

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-container-high ${className}`} />
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / 3600000)
  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { dashboard: d, isLoading } = useDashboard()

  const maxCount = d ? Math.max(...d.monthlySales.map((m) => m.count), 1) : 1

  return (
    <div className="p-8">
      <div className="flex flex-col mb-10">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
          Dashboard
        </h2>
        <p className="text-on-surface-variant font-medium">
          Real-time overview of your inventory and sales.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Sales */}
        <div className="bg-surface-container-lowest p-6 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">Total Sales</p>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <h3 className="font-headline text-2xl font-bold">{d?.totalSales.toLocaleString() ?? '0'}</h3>
          )}
        </div>

        {/* Revenue */}
        <div className="bg-surface-container-lowest p-6 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container rounded-lg">
              <span className="material-symbols-outlined text-on-secondary-container">payments</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">Revenue</p>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <h3 className="font-headline text-2xl font-bold">
              ₦{d?.revenue.toLocaleString() ?? '0'}
            </h3>
          )}
        </div>

        {/* Items in Stock */}
        <div className="bg-surface-container-lowest p-6 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-container rounded-lg">
              <span className="material-symbols-outlined text-on-tertiary-container">inventory</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">Items in Stock</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <h3 className="font-headline text-2xl font-bold">{d?.itemsInStock.toLocaleString() ?? '0'}</h3>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-error-container/10 border border-error/5 p-6 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container rounded-lg">
              <span className="material-symbols-outlined text-on-error-container">warning</span>
            </div>
            {!isLoading && (d?.lowStockCount ?? 0) > 0 && (
              <span className="text-xs font-bold text-error">Action Required</span>
            )}
          </div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">Low Stock Alerts</p>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <h3 className="font-headline text-2xl font-bold">{d?.lowStockCount ?? '0'}</h3>
          )}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Sales Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
          <div className="mb-10">
            <h4 className="font-headline text-xl font-bold">Sales Performance</h4>
            <p className="text-on-surface-variant text-sm">Units sold per month — last 6 months</p>
          </div>
          <div className="h-48 flex items-end justify-between gap-4 px-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4">
                    <Skeleton className="w-full" style={{ height: `${40 + i * 15}px` } as React.CSSProperties} />
                    <Skeleton className="h-3 w-6" />
                  </div>
                ))
              : d?.monthlySales.map((bar, i) => {
                  const heightPct = maxCount > 0 ? (bar.count / maxCount) * 100 : 0
                  const isLast = i === (d.monthlySales.length - 1)
                  return (
                    <div key={bar.month} className="flex-1 flex flex-col items-center gap-3 group">
                      <span className="text-xs font-bold text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                        {bar.count}
                      </span>
                      <div className="w-full flex items-end" style={{ height: '160px' }}>
                        <div
                          className={`w-full rounded-t-lg transition-all ${isLast ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'}`}
                          style={{ height: `${Math.max(heightPct, bar.count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isLast ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {bar.month}
                      </span>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-headline font-bold">Recent Sales</h4>
          </div>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              : d?.recentSales.length === 0
              ? (
                <p className="text-sm text-on-surface-variant text-center py-8">No sales yet.</p>
              )
              : d?.recentSales.map((sale) => (
                  <div
                    key={sale._id}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-surface-container-low transition-all"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${sale.paymentStatus === 'paid' ? 'bg-emerald-50' : 'bg-error-container/20'}`}>
                      <span className={`material-symbols-outlined text-lg ${sale.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-error'}`}>
                        {sale.paymentStatus === 'paid' ? 'sell' : 'undo'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-bold truncate">{sale.name}</span>
                      <span className="block text-xs text-on-surface-variant">{sale.serialNumber} · qty {sale.quantity}</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-medium shrink-0">
                      {formatDate(sale.createdAt)}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}
