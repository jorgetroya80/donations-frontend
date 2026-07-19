import dayjs from 'dayjs'
import { FileBarChart } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { DateRangePicker } from '@/components/date-range-picker'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
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
import { TabList } from '@/components/ui/tabs'
import { DonorPicker } from '@/features/donors/donor-picker'
import { currentMonthRange, formatCurrency } from '@/lib/formatters'
import { getProblemMessage } from '@/lib/get-problem-message'
import {
  useDonationReport,
  useDonorStatement,
  useExpenseReport,
} from './use-reports'

type Tab = 'donations' | 'expenses' | 'donor-statement'

function formatDate(d: Date) {
  return dayjs(d).format('YYYY-MM-DD')
}

function DonationSummaryTab() {
  const { t } = useTranslation()
  const [range, setRange] = useState(currentMonthRange)
  const { data, isLoading, error } = useDonationReport({
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

      {data && (data.totalsByType ?? []).length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.type')}</TableHead>
                  <TableHead className="text-right">
                    {t('reports.total')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.totalsByType ?? []).map((row) => (
                  <TableRow key={row.type}>
                    <TableCell>{t(`donations.types.${row.type}`)}</TableCell>
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

function ExpenseSummaryTab() {
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

function DonorStatementTab() {
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

const tabs: { key: Tab; labelKey: string }[] = [
  { key: 'donations', labelKey: 'reports.donationSummary' },
  { key: 'expenses', labelKey: 'reports.expenseSummary' },
  { key: 'donor-statement', labelKey: 'reports.donorStatement' },
]

export function ReportsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab')
  const activeTab: Tab = tabs.some((tab) => tab.key === tabParam)
    ? (tabParam as Tab)
    : 'donations'

  function selectTab(tab: Tab) {
    // Re-clicking the active tab must not stack duplicate history entries.
    if (tab === activeTab) return
    // Tabs feel like places: push (default) so Back steps between them.
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (tab === 'donations') {
        params.delete('tab')
      } else {
        params.set('tab', tab)
      }
      // Leaving the donor-statement tab drops the selection, as before.
      params.delete('donorId')
      return params
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('reports.title')} />

      <TabList
        tabs={tabs.map((tab) => ({ key: tab.key, label: t(tab.labelKey) }))}
        value={activeTab}
        onChange={selectTab}
      />

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'donations' && <DonationSummaryTab />}
        {activeTab === 'expenses' && <ExpenseSummaryTab />}
        {activeTab === 'donor-statement' && <DonorStatementTab />}
      </div>
    </div>
  )
}
