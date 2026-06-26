import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { useDonor, useDonors } from './use-donors'

interface DonorPickerProps {
  value: number | null
  onChange: (id: number | null) => void
}

export function DonorPicker({ value, onChange }: DonorPickerProps) {
  const { t } = useTranslation()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(-1)
  const debouncedQuery = useDebouncedValue(query, 250)

  const { data: selectedDonor } = useDonor(value ?? 0)
  const { data, isLoading, error } = useDonors(
    { page: 0, size: 10, sort: 'fullName,asc', search: debouncedQuery },
    { enabled: open }
  )
  const donors = data?.content ?? []

  // Close on outside interaction.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const optionId = (id: number | undefined) => `${listboxId}-opt-${id}`

  function select(id: number | null | undefined) {
    if (id == null) return
    onChange(id)
    setOpen(false)
    setQuery('')
    setHighlight(-1)
  }

  function openWithFreshQuery() {
    setOpen(true)
    setQuery('')
    setHighlight(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        openWithFreshQuery()
        return
      }
      setHighlight((h) => Math.min(h + 1, donors.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && donors[highlight]) {
        e.preventDefault()
        select(donors[highlight].id)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const inputValue = open ? query : (selectedDonor?.fullName ?? '')

  return (
    <div ref={containerRef} className="relative flex gap-2">
      <input
        id="donorId"
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && highlight >= 0 ? optionId(donors[highlight]?.id) : undefined
        }
        placeholder={t('donations.searchDonor')}
        className="flex h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        value={inputValue}
        onFocus={() => {
          if (!open) openWithFreshQuery()
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setHighlight(-1)
          if (!open) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('donations.clearDonor')}
        aria-hidden={value == null}
        tabIndex={value == null ? -1 : 0}
        className={`relative transition-opacity duration-150 before:absolute before:-inset-1 before:content-[''] ${
          value == null ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        onClick={() => {
          onChange(null)
          setQuery('')
          setOpen(false)
        }}
      >
        <X size={16} />
      </Button>

      {open && (
        <div className="absolute top-9 left-0 z-50 w-full overflow-hidden rounded-lg border border-input bg-background shadow-md">
          {error ? (
            <Alert variant="destructive" className="border-0">
              <AlertDescription>{t('donors.errorLoading')}</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div
              aria-busy="true"
              aria-label={t('common.loading')}
              className="space-y-2 p-2"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : donors.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t('donations.noDonorsFound')}
            </p>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-64 overflow-auto py-1"
            >
              {donors.map((donor, i) => (
                <li
                  key={donor.id}
                  id={optionId(donor.id)}
                  role="option"
                  aria-selected={i === highlight}
                  className={`flex cursor-pointer flex-col px-3 py-2 text-sm ${
                    i === highlight ? 'bg-accent' : ''
                  } ${donor.id === value ? 'font-medium' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => select(donor.id)}
                >
                  <span>{donor.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {donor.nationalId ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
