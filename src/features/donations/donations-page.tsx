import dayjs from 'dayjs'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { DateRangePicker } from '@/components/date-range-picker'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { TableSkeleton } from '@/components/skeleton'
import { SortableTh } from '@/components/sortable-th'
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
import { currentMonthRange, formatCurrency } from '@/lib/formatters'
import { getProblemMessage } from '@/lib/get-problem-message'
import { useSort } from '@/lib/use-sort'
import { useDonations } from './use-donations'

export function DonationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { sort, toggleSort, sortIndicator, ariaSort } = useSort(
    'donationDate,desc',
    () => setPage(0)
  )
  const [range, setRange] = useState(currentMonthRange)

  const { data, isLoading, error } = useDonations({
    page,
    size: 10,
    sort,
    from: dayjs(range.from).format('YYYY-MM-DD'),
    to: dayjs(range.to).format('YYYY-MM-DD'),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title={t('donations.title')} />
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
          <AlertDescription>
            {getProblemMessage(error, t('donations.errorLoading'))}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <TableSkeleton />}

      {data && (data.content ?? []).length === 0 && (
        <EmptyState
          icon={<Plus size={40} />}
          message={t('donations.empty')}
          cta={{
            label: t('donations.new'),
            onClick: () => navigate('/donations/new'),
          }}
        />
      )}

      {data && (data.content ?? []).length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTh
                  ariaSort={ariaSort('donationDate')}
                  onSort={() => toggleSort('donationDate')}
                  indicator={sortIndicator('donationDate')}
                >
                  {t('donations.date')}
                </SortableTh>
                <SortableTh
                  ariaSort={ariaSort('amount')}
                  onSort={() => toggleSort('amount')}
                  indicator={sortIndicator('amount')}
                >
                  {t('donations.amount')}
                </SortableTh>
                <TableHead>{t('donations.type')}</TableHead>
                <TableHead>{t('donations.paymentMethod')}</TableHead>
                <TableHead>{t('donations.donor')}</TableHead>
                <TableHead className="w-16">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.content ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    {dayjs(d.donationDate).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell>{formatCurrency(d.amount ?? 0)}</TableCell>
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
                page: (data.page?.number ?? 0) + 1,
                total: data.page?.totalPages ?? 0,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(data.page?.number ?? 0) === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('donations.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  (data.page?.number ?? 0) >= (data.page?.totalPages ?? 0) - 1
                }
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
