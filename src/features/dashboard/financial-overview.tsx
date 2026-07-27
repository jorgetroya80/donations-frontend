import { ArrowDownRight, ArrowUpRight, BarChart3, Scale } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateRangePicker } from '@/components/date-range-picker'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { useDonationReport, useExpenseReport } from '@/features/reports'
import { currentMonthRange, formatDate } from '@/lib/formatters'
import { getProblemMessage } from '@/lib/get-problem-message'
import { ComparisonBarChart } from './comparison-bar-chart.lazy'
import { previousRange } from './financial-overview.utils'
import { StatCard } from './stat-card'
import { useBalance } from './use-dashboard-data'

const donationTypes = ['TITHE', 'OFFERING', 'SPECIAL_OFFERING', 'OTHER']

export function FinancialOverview() {
  const { t } = useTranslation()

  const donationChartConfig: ChartConfig = Object.fromEntries(
    donationTypes.map((type, i) => [
      type,
      { label: t(`donations.types.${type}`), color: `var(--chart-${i + 1})` },
    ])
  )
  const comparisonConfig: ChartConfig = {
    current: { label: t('dashboard.currentPeriod'), color: 'var(--chart-1)' },
    previous: { label: t('dashboard.previousPeriod'), color: 'var(--chart-3)' },
  }
  const [range, setRange] = useState(currentMonthRange)

  const dateParams = {
    from: formatDate(range.from),
    to: formatDate(range.to),
  }
  const prevDateParams = previousRange(range.from, range.to)

  const balance = useBalance(dateParams)
  const donations = useDonationReport(dateParams)
  const expenses = useExpenseReport(dateParams)
  const prevDonations = useDonationReport(prevDateParams)
  const prevBalance = useBalance(prevDateParams)
  const prevExpenses = useExpenseReport(prevDateParams)

  const isLoading =
    balance.isLoading || donations.isLoading || expenses.isLoading
  const error = balance.error || donations.error || expenses.error

  const makeDonationItem = (type: string | null | undefined) => ({
    type: donationChartConfig[type ?? '']?.label ?? type ?? '',
    current:
      donations.data?.totalsByType?.find((d) => d.type === type)?.total ?? 0,
    previous:
      prevDonations.data?.totalsByType?.find((d) => d.type === type)?.total ??
      0,
  })

  const allDonationTypes = Array.from(
    new Set([
      ...(donations.data?.totalsByType?.map((d) => d.type) ?? []),
      ...(prevDonations.data?.totalsByType?.map((d) => d.type) ?? []),
    ])
  )
  const titheData = allDonationTypes
    .filter((t) => t === 'TITHE')
    .map(makeDonationItem)
  const otherDonationsData = allDonationTypes
    .filter((t) => t !== 'TITHE')
    .map(makeDonationItem)

  const expenseChartData =
    expenses.data?.totalsByCategory?.map((cur) => ({
      category: cur.category ? t(`expenses.categories.${cur.category}`) : '',
      current: cur.total ?? 0,
      previous:
        prevExpenses.data?.totalsByCategory?.find(
          (e) => e.category === cur.category
        )?.total ?? 0,
    })) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('dashboard.financialOverview')}
        </h2>
        <DateRangePicker
          from={range.from}
          to={range.to}
          onChange={(from, to) => setRange({ from, to })}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getProblemMessage(error, t('dashboard.errorLoading'))}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div aria-busy="true" aria-label={t('common.loading')}>
          <Skeleton />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t('dashboard.totalIncome')}
          icon={<ArrowUpRight size={16} className="text-success" />}
          value={balance.data ? (balance.data.totalIncome ?? 0) : undefined}
          current={balance.data?.totalIncome}
          previous={prevBalance.data?.totalIncome}
        />
        <StatCard
          label={t('dashboard.totalExpenses')}
          icon={<ArrowDownRight size={16} className="text-destructive" />}
          value={balance.data ? (balance.data.totalExpenses ?? 0) : undefined}
          current={balance.data?.totalExpenses}
          previous={prevBalance.data?.totalExpenses}
          inverted
        />
        <StatCard
          label={t('dashboard.netBalance')}
          icon={<Scale size={16} className="text-muted-foreground" />}
          value={balance.data ? (balance.data.netBalance ?? 0) : undefined}
          current={balance.data?.netBalance}
          previous={prevBalance.data?.netBalance}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.donationsByType')}</CardTitle>
          </CardHeader>
          <CardContent>
            {titheData.length > 0 || otherDonationsData.length > 0 ? (
              <div className="space-y-4">
                {titheData.length > 0 && (
                  <ComparisonBarChart
                    data={titheData}
                    config={comparisonConfig}
                    categoryKey="type"
                    categoryWidth={120}
                    className="max-h-20"
                  />
                )}
                {otherDonationsData.length > 0 && (
                  <ComparisonBarChart
                    data={otherDonationsData}
                    config={comparisonConfig}
                    categoryKey="type"
                    categoryWidth={120}
                    showLegend
                    className="max-h-45"
                  />
                )}
              </div>
            ) : (
              <EmptyState
                icon={<BarChart3 size={40} />}
                message={t('dashboard.noData')}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseChartData.length > 0 ? (
              <ComparisonBarChart
                data={expenseChartData}
                config={comparisonConfig}
                categoryKey="category"
                categoryWidth={100}
                showLegend
                className="max-h-75"
              />
            ) : (
              <EmptyState
                icon={<BarChart3 size={40} />}
                message={t('dashboard.noData')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
