import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateRangePicker } from '@/components/date-range-picker'
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
import { useDonors } from '@/features/donations/use-donations'
import {
  useDonationReport,
  useDonorStatement,
  useExpenseReport,
} from './use-reports'

type Tab = 'donations' | 'expenses' | 'donor-statement'

function currentMonthRange() {
  return {
    from: dayjs().startOf('month').toDate(),
    to: dayjs().endOf('month').toDate(),
  }
}

function formatDate(d: Date) {
  return dayjs(d).format('YYYY-MM-DD')
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
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
          <AlertDescription>{t('reports.errorLoading')}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Alert>
          <AlertDescription>{t('common.loading')}</AlertDescription>
        </Alert>
      )}

      {data && data.totalsByType.length > 0 ? (
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
                {data.totalsByType.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell>{t(`donations.types.${row.type}`)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>{t('reports.grandTotal')}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        data && <p className="text-muted-foreground">{t('reports.noData')}</p>
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
          <AlertDescription>{t('reports.errorLoading')}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Alert>
          <AlertDescription>{t('common.loading')}</AlertDescription>
        </Alert>
      )}

      {data && data.totalsByCategory.length > 0 ? (
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
                {data.totalsByCategory.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell>
                      {t(`expenses.categories.${row.category}`)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>{t('reports.grandTotal')}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        data && <p className="text-muted-foreground">{t('reports.noData')}</p>
      )}
    </div>
  )
}

function DonorStatementTab() {
  const { t } = useTranslation()
  const [range, setRange] = useState(currentMonthRange)
  const [donorId, setDonorId] = useState<number | null>(null)
  const { data: donorsPage } = useDonors()
  const { data, isLoading, error } = useDonorStatement(donorId, {
    from: formatDate(range.from),
    to: formatDate(range.to),
  })

  const donors = donorsPage?.content ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={donorId ?? ''}
          onChange={(e) => {
            const val = e.target.value
            setDonorId(val ? Number(val) : null)
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label={t('reports.selectDonor')}
        >
          <option value="">{t('reports.selectDonor')}</option>
          {donors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>
        <DateRangePicker
          from={range.from}
          to={range.to}
          onChange={(from, to) => setRange({ from, to })}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t('reports.errorLoading')}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Alert>
          <AlertDescription>{t('common.loading')}</AlertDescription>
        </Alert>
      )}

      {!donorId && (
        <p className="text-muted-foreground">{t('reports.noDonorSelected')}</p>
      )}

      {data && data.donations.length > 0 ? (
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
                {data.donations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{dayjs(d.date).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{t(`donations.types.${d.type}`)}</TableCell>
                    <TableCell>
                      {t(`donations.paymentMethods.${d.paymentMethod}`)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(d.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={3}>{t('reports.grandTotal')}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        data &&
        data.donations.length === 0 && (
          <p className="text-muted-foreground">{t('reports.noData')}</p>
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
  const [activeTab, setActiveTab] = useState<Tab>('donations')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('reports.title')}</h1>

      <div className="border-b">
        <nav className="-mb-px flex gap-4" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>
      </div>

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
