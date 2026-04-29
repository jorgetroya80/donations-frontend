import dayjs from 'dayjs'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { DateRangePicker } from '@/components/date-range-picker'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDonations } from './use-donations'

function currentMonthRange() {
  return {
    from: dayjs().startOf('month').toDate(),
    to: dayjs().endOf('month').toDate(),
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function DonationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('donationDate,desc')
  const [range, setRange] = useState(currentMonthRange)

  const { data, isLoading, error } = useDonations({
    page,
    size: 10,
    sort,
    from: dayjs(range.from).format('YYYY-MM-DD'),
    to: dayjs(range.to).format('YYYY-MM-DD'),
  })

  function toggleSort(field: string) {
    const [currentField, currentDir] = sort.split(',')
    if (currentField === field) {
      setSort(`${field},${currentDir === 'asc' ? 'desc' : 'asc'}`)
    } else {
      setSort(`${field},asc`)
    }
    setPage(0)
  }

  function sortIndicator(field: string) {
    const [currentField, currentDir] = sort.split(',')
    if (currentField !== field) return ''
    return currentDir === 'asc' ? ' ↑' : ' ↓'
  }

  function ariaSort(field: string): 'ascending' | 'descending' | 'none' {
    const [currentField, currentDir] = sort.split(',')
    if (currentField !== field) return 'none'
    return currentDir === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('donations.title')}</h1>
        <div className="flex items-center gap-2">
          <DateRangePicker
            from={range.from}
            to={range.to}
            onChange={(from, to) => {
              setRange({ from, to })
              setPage(0)
            }}
          />
          <Button onClick={() => navigate('/donations/new')}>
            <Plus size={16} />
            {t('donations.new')}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t('donations.errorLoading')}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div
          aria-busy="true"
          aria-label={t('common.loading')}
          className="space-y-2"
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )}

      {data && data.content.length === 0 && (
        <EmptyState
          icon={<Plus size={40} />}
          message={t('donations.empty')}
          cta={{
            label: t('donations.new'),
            onClick: () => navigate('/donations/new'),
          }}
        />
      )}

      {data && data.content.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort('donationDate')}
                  tabIndex={0}
                  aria-sort={ariaSort('donationDate')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSort('donationDate')
                    }
                  }}
                >
                  {t('donations.date')}
                  <span aria-hidden="true">
                    {sortIndicator('donationDate')}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort('amount')}
                  tabIndex={0}
                  aria-sort={ariaSort('amount')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSort('amount')
                    }
                  }}
                >
                  {t('donations.amount')}
                  <span aria-hidden="true">{sortIndicator('amount')}</span>
                </TableHead>
                <TableHead>{t('donations.type')}</TableHead>
                <TableHead>{t('donations.paymentMethod')}</TableHead>
                <TableHead>{t('donations.donor')}</TableHead>
                <TableHead className="w-16">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    {dayjs(d.donationDate).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell>{formatCurrency(d.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`donations.types.${d.donationType}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t(`donations.paymentMethods.${d.paymentMethod}`)}
                  </TableCell>
                  <TableCell>{d.donorName ?? t('donations.noDonor')}</TableCell>
                  <TableCell>
                    <Link
                      to={`/donations/${d.id}/edit`}
                      className={buttonVariants({
                        variant: 'ghost',
                        size: 'icon',
                      })}
                      aria-label={t('donations.editLabel', {
                        date: dayjs(d.donationDate).format('DD/MM/YYYY'),
                      })}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('donations.page', {
                page: data.number + 1,
                total: data.totalPages,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.number === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('donations.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.number >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('donations.next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
