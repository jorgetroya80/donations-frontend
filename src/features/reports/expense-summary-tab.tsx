import { FileBarChart } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateRangePicker } from '@/components/date-range-picker'
import { EmptyState } from '@/components/empty-state'
import { TableSkeleton } from '@/components/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
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
import { formatDate } from './format-date'
import { useExpenseReport } from './use-reports'

export function ExpenseSummaryTab() {
  const { t } = useTranslation()
  const [range, setRange] = useState(currentMonthRange)
  const { data, isLoading, error } = useExpenseReport({
    from: formatDate(range.from),
    to: formatDate(range.to),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangePicker
          from={range.from}
          to={range.to}
          onChange={(from, to) => setRange({ from, to })}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getProblemMessage(error, t('reports.errorLoading'))}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <TableSkeleton rows={3} />}

      {data && (data.totalsByCategory ?? []).length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.category')}</TableHead>
                  <TableHead className="text-right">
                    {t('reports.total')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.totalsByCategory ?? []).map((row) => (
                  <TableRow key={row.category}>
                    <TableCell>
                      {t(`expenses.categories.${row.category}`)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.total ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>{t('reports.grandTotal')}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.grandTotal ?? 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        data && (
          <EmptyState
            icon={<FileBarChart size={40} />}
            message={t('reports.noData')}
          />
        )
      )}
    </div>
  )
}
