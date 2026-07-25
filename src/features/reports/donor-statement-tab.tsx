import dayjs from 'dayjs'
import { FileBarChart } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { DateRangePicker } from '@/components/date-range-picker'
import { EmptyState } from '@/components/empty-state'
import { TableSkeleton } from '@/components/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DonorPicker } from '@/features/donors'
import { currentMonthRange, formatCurrency } from '@/lib/formatters'
import { getProblemMessage } from '@/lib/get-problem-message'
import { formatDate } from './format-date'
import { useDonorStatement } from './use-reports'

export function DonorStatementTab() {
  const { t } = useTranslation()
  const [range, setRange] = useState(currentMonthRange)
  const [searchParams, setSearchParams] = useSearchParams()

  const rawDonorId = searchParams.get('donorId')
  const parsedDonorId = rawDonorId === null ? Number.NaN : Number(rawDonorId)
  const donorId =
    Number.isInteger(parsedDonorId) && parsedDonorId > 0 ? parsedDonorId : null

  function setDonorId(id: number | null) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (id === null) {
          params.delete('donorId')
        } else {
          params.set('donorId', String(id))
        }
        return params
      },
      { replace: true }
    )
  }

  const { data, isLoading, error } = useDonorStatement(donorId, {
    from: formatDate(range.from),
    to: formatDate(range.to),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-56 flex-1 sm:max-w-sm">
          <DonorPicker value={donorId} onChange={setDonorId} />
        </div>
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

      {!donorId && (
        <p className="text-muted-foreground">{t('reports.noDonorSelected')}</p>
      )}

      {data && (data.donations ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{data.donorName}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.date')}</TableHead>
                  <TableHead>{t('reports.type')}</TableHead>
                  <TableHead>{t('reports.paymentMethod')}</TableHead>
                  <TableHead className="text-right">
                    {t('reports.amount')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.donations ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{dayjs(d.date).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{t(`donations.types.${d.type}`)}</TableCell>
                    <TableCell>
                      {t(`donations.paymentMethods.${d.paymentMethod}`)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(d.amount ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={3}>{t('reports.grandTotal')}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.total ?? 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        data &&
        (data.donations ?? []).length === 0 && (
          <EmptyState
            icon={<FileBarChart size={40} />}
            message={t('reports.noData')}
          />
        )
      )}
    </div>
  )
}
