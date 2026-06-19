import { X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSort } from '@/lib/use-sort'
import { useDonor, useDonors } from './use-donors'

interface DonorPickerProps {
  value: number | null
  onChange: (id: number | null) => void
}

export function DonorPicker({ value, onChange }: DonorPickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { data: selectedDonor } = useDonor(value ?? 0)

  const label =
    value && selectedDonor?.fullName
      ? selectedDonor.fullName
      : t('donations.selectDonor')

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-w-0 flex-1 justify-start font-normal"
        onClick={() => setOpen(true)}
      >
        <span className={`truncate ${value ? '' : 'text-muted-foreground'}`}>
          {label}
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('donations.clearDonor')}
        aria-hidden={value == null}
        tabIndex={value == null ? -1 : 0}
        className={`transition-opacity duration-150 ${
          value == null ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        onClick={() => onChange(null)}
      >
        <X size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('donations.selectDonor')}</DialogTitle>
          </DialogHeader>
          <DonorPickerTable
            onSelect={(id) => {
              onChange(id)
              setOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DonorPickerTable({ onSelect }: { onSelect: (id: number) => void }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const { sort, toggleSort, sortIndicator, ariaSort } = useSort(
    'fullName,asc',
    () => setPage(0)
  )
  const { data, isLoading } = useDonors({ page, size: 10, sort })
  const donors = data?.content ?? []

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label={t('common.loading')}
        className="space-y-2"
      >
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    )
  }

  if (donors.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        {t('donors.empty')}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer"
              onClick={() => toggleSort('fullName')}
              tabIndex={0}
              aria-sort={ariaSort('fullName')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleSort('fullName')
                }
              }}
            >
              {t('donors.fullName')}
              <span aria-hidden="true">{sortIndicator('fullName')}</span>
            </TableHead>
            <TableHead>{t('donors.nationalId')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donors.map((donor) => (
            <TableRow key={donor.id}>
              <TableCell>
                <button
                  type="button"
                  className="block w-full rounded py-1 text-left font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    if (donor.id != null) onSelect(donor.id)
                  }}
                >
                  {donor.fullName}
                </button>
              </TableCell>
              <TableCell>{donor.nationalId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('donors.page', {
            page: (data?.page?.number ?? 0) + 1,
            total: data?.page?.totalPages ?? 0,
          })}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={(data?.page?.number ?? 0) === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('donors.previous')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              (data?.page?.number ?? 0) >= (data?.page?.totalPages ?? 0) - 1
            }
            onClick={() => setPage((p) => p + 1)}
          >
            {t('donors.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
