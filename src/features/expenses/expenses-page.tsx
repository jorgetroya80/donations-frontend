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
import { useExpenses } from './use-expenses'

export function ExpensesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { sort, toggleSort, sortIndicator, ariaSort } = useSort(
    'expenseDate,desc',
    () => setPage(0)
  )
  const [range, setRange] = useState(currentMonthRange)

  const { data, isLoading, error } = useExpenses({
    page,
    size: 10,
    sort,
    from: dayjs(range.from).format('YYYY-MM-DD'),
    to: dayjs(range.to).format('YYYY-MM-DD'),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title={t('expenses.title')} />
        <div className="flex items-center gap-2">
          <DateRangePicker
            from={range.from}
            to={range.to}
            onChange={(from, to) => {
              setRange({ from, to })
              setPage(0)
            }}
          />
          <Button onClick={() => navigate('/expenses/new')}>
            <Plus size={16} />
            {t('expenses.new')}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getProblemMessage(error, t('expenses.errorLoading'))}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <TableSkeleton />}

      {data && (data.content ?? []).length === 0 && (
        <EmptyState
          icon={<Plus size={40} />}
          message={t('expenses.empty')}
          cta={{
            label: t('expenses.new'),
            onClick: () => navigate('/expenses/new'),
          }}
        />
      )}

      {data && (data.content ?? []).length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTh
                  ariaSort={ariaSort('expenseDate')}
                  onSort={() => toggleSort('expenseDate')}
                  indicator={sortIndicator('expenseDate')}
                >
                  {t('expenses.date')}
                </SortableTh>
                <SortableTh
                  ariaSort={ariaSort('amount')}
                  onSort={() => toggleSort('amount')}
                  indicator={sortIndicator('amount')}
                >
                  {t('expenses.amount')}
                </SortableTh>
                <TableHead>{t('expenses.category')}</TableHead>
                <TableHead>{t('expenses.description')}</TableHead>
                <TableHead>{t('expenses.paymentMethod')}</TableHead>
                <TableHead className="w-16">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.content ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {dayjs(e.expenseDate).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell>{formatCurrency(e.amount ?? 0)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`expenses.categories.${e.category}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-48 truncate">
                    {e.description}
                  </TableCell>
                  <TableCell>
                    {t(`expenses.paymentMethods.${e.paymentMethod}`)}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/expenses/${e.id}/edit`}
                      className={buttonVariants({
                        variant: 'ghost',
                        size: 'icon',
                      })}
                      aria-label={t('expenses.editLabel', {
                        date: dayjs(e.expenseDate).format('DD/MM/YYYY'),
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
              {t('expenses.page', {
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
                {t('expenses.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  (data.page?.number ?? 0) >= (data.page?.totalPages ?? 0) - 1
                }
                onClick={() => setPage((p) => p + 1)}
              >
                {t('expenses.next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
