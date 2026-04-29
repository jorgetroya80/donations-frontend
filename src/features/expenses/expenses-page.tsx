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
import { currentMonthRange, formatCurrency } from '@/lib/formatters'
import { useExpenses } from './use-expenses'

export function ExpensesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('expenseDate,desc')
  const [range, setRange] = useState(currentMonthRange)

  const { data, isLoading, error } = useExpenses({
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
        <h1 className="text-2xl font-bold">{t('expenses.title')}</h1>
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
          <AlertDescription>{t('expenses.errorLoading')}</AlertDescription>
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
          message={t('expenses.empty')}
          cta={{
            label: t('expenses.new'),
            onClick: () => navigate('/expenses/new'),
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
                  onClick={() => toggleSort('expenseDate')}
                  tabIndex={0}
                  aria-sort={ariaSort('expenseDate')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSort('expenseDate')
                    }
                  }}
                >
                  {t('expenses.date')}
                  <span aria-hidden="true">{sortIndicator('expenseDate')}</span>
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
                  {t('expenses.amount')}
                  <span aria-hidden="true">{sortIndicator('amount')}</span>
                </TableHead>
                <TableHead>{t('expenses.category')}</TableHead>
                <TableHead>{t('expenses.description')}</TableHead>
                <TableHead>{t('expenses.paymentMethod')}</TableHead>
                <TableHead className="w-16">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {dayjs(e.expenseDate).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell>{formatCurrency(e.amount)}</TableCell>
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
                {t('expenses.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.number >= data.totalPages - 1}
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
