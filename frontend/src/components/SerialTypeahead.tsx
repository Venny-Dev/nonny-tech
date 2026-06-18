import { useEffect, useRef, useState } from 'react'
import shopIncomingService from '../services/shopIncomingService'
import type { TypeaheadResult } from '../services/shopIncomingService'

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect: (result: TypeaheadResult) => void
  onClear: () => void
}

const inputCls =
  'w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

export default function SerialTypeahead({ value, onChange, onSelect, onClear }: Props) {
  const [results, setResults] = useState<TypeaheadResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!value.trim()) {
        setResults([])
        setShowDropdown(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      shopIncomingService
        .search(value)
        .then((data) => {
          setResults(data)
          setShowDropdown(true)
        })
        .catch(() => setResults([]))
        .finally(() => setIsLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [value])

  // Outside click detection
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    onChange(next)
    if (!next.trim()) {
      onClear()
      setResults([])
      setShowDropdown(false)
    }
  }

  function handleSelect(result: TypeaheadResult) {
    onSelect(result)
    setShowDropdown(false)
    setResults([])
  }

  const showNoMatches = showDropdown && !isLoading && value.trim().length > 0 && results.length === 0

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className={inputCls}
          value={value}
          onChange={handleChange}
          placeholder="Search serial number..."
          autoComplete="off"
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant animate-pulse">
            …
          </span>
        )}
      </div>

      {(showDropdown || showNoMatches) && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-outline-variant/40 bg-white shadow-lg overflow-hidden">
          {showNoMatches ? (
            <li className="px-3 py-2 text-sm text-on-surface-variant">No matches found</li>
          ) : (
            results.map((r) => (
              <li
                key={r.entryId}
                className="flex flex-col px-3 py-2 cursor-pointer hover:bg-surface-container transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(r)
                }}
              >
                <span className="text-sm font-semibold">{r.serialNumber}</span>
                <span className="text-xs text-on-surface-variant">{r.modelNumber}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
