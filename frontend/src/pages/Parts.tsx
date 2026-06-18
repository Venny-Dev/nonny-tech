import { Link } from 'react-router-dom'
import { useParts } from '../hooks/useParts'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export default function Parts() {
  const { parts, isLoading } = useParts()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-1">
            Parts &amp; Upgrades
          </h1>
          <p className="text-on-surface-variant">
            Track components removed from laptops before sale.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant gap-2">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Loading parts...
            </div>
          ) : parts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-30">
                build_circle
              </span>
              <p className="text-base font-medium">No parts removals recorded yet.</p>
              <p className="text-sm mt-1 text-on-surface-variant/70">
                Parts removed from laptops before sale will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-low/40">
                  <th className="px-6 py-3">Serial No.</th>
                  <th className="px-6 py-3">Part Type</th>
                  <th className="px-6 py-3">Original Value</th>
                  <th className="px-6 py-3">Sold-With Value</th>
                  <th className="px-6 py-3">Removed Value</th>
                  <th className="px-6 py-3">Date Removed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {parts.map((part) => (
                  <tr
                    key={part._id}
                    className="group hover:bg-surface-container-low/50 transition-colors"
                  >
                    {/* Serial No. — links to the shop incoming record */}
                    <td className="px-6 py-4">
                      <Link
                        to={`/shop-incoming/${part.shopIncomingId}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {part.serialNumber}
                      </Link>
                    </td>

                    {/* Part Type */}
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          part.partType === 'ram'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-tertiary-container text-on-tertiary-container'
                        }`}
                      >
                        {part.partType === 'ram' ? 'RAM' : 'Storage'}
                      </span>
                    </td>

                    {/* Original Value */}
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {part.originalValue}
                    </td>

                    {/* Sold-With Value */}
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {part.soldValue}
                    </td>

                    {/* Removed Value */}
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {part.removedValue}
                    </td>

                    {/* Date Removed */}
                    <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                      {formatDate(part.removedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && parts.length > 0 && (
          <div className="flex items-center px-6 py-4 border-t border-outline-variant/20 text-xs text-on-surface-variant">
            <span>{parts.length} part removal{parts.length !== 1 ? 's' : ''} recorded</span>
          </div>
        )}
      </div>
    </div>
  )
}
