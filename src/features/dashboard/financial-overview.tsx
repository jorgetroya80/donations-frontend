import { ArrowDownRight, ArrowUpRight, BarChart3, Scale } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateRangePicker } from '@/components/date-range-picker'
import { EmptyState } from '@/components/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDonationReport, useExpenseReport } from '@/features/reports'
import { currentMonthRange, formatCurrency, formatDate } from '@/lib/formatters'
import { getProblemMessage } from '@/lib/get-problem-message'
import { CategoryRanking, type RankingItem } from './category-ranking'
import { previousRange } from './financial-overview.utils'
import { StatCard } from './stat-card'
import { useBalance } from './use-dashboard-data'

const donationTypes = ['TITHE', 'OFFERING', 'SPECIAL_OFFERING', 'OTHER']

export function FinancialOverview() {
  const { t } = useTranslation()

  const donationTypeLabels: Record<string, string> = Object.fromEntries(
    donationTypes.map((type) => [type, t(`donations.types.${type}`)])
  )
  const donationsTitle = t('dashboard.donationsByType')
  const expensesTitle = t('dashboard.expensesByCategory')
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

  // A category can appear in either period only: unioning both keeps a
  // category that dropped to zero visible, as the -100% it is.
  const allDonationTypes = Array.from(
    new Set([
      ...(donations.data?.totalsByType?.map((d) => d.type) ?? []),
      ...(prevDonations.data?.totalsByType?.map((d) => d.type) ?? []),
    ])
  )
  const donationRows: RankingItem[] = allDonationTypes.map((type) => ({
    key: type ?? '',
    label: donationTypeLabels[type ?? ''] ?? type ?? '',
    current:
      donations.data?.totalsByType?.find((d) => d.type === type)?.total ?? 0,
    previous:
      prevDonations.data?.totalsByType?.find((d) => d.type === type)?.total ??
      0,
  }))

  const allExpenseCategories = Array.from(
    new Set([
      ...(expenses.data?.totalsByCategory?.map((e) => e.category) ?? []),
      ...(prevExpenses.data?.totalsByCategory?.map((e) => e.category) ?? []),
    ])
  )
  const expenseRows: RankingItem[] = allExpenseCategories.map((category) => ({
    key: category ?? '',
    label: category ? t(`expenses.categories.${category}`) : '',
    current:
      expenses.data?.totalsByCategory?.find((e) => e.category === category)
        ?.total ?? 0,
    previous:
      prevExpenses.data?.totalsByCategory?.find((e) => e.category === category)
        ?.total ?? 0,
  }))

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

      <div className="grid gap-4 sm:grid-cols-3" aria-busy={isLoading}>
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
          <CardHeader className="flex flex-row items-baseline justify-between gap-3">
            <CardTitle>{donationsTitle}</CardTitle>
            {donations.data?.grandTotal != null && (
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {t('dashboard.periodTotal', {
                  amount: formatCurrency(donations.data.grandTotal),
                })}
              </span>
            )}
          </CardHeader>
          <CardContent className="min-h-75">
            {donationRows.length > 0 ? (
              <CategoryRanking items={donationRows} title={donationsTitle} />
            ) : (
              <EmptyState
                icon={<BarChart3 size={40} />}
                message={t('dashboard.noData')}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-baseline justify-between gap-3">
            <CardTitle>{expensesTitle}</CardTitle>
            {expenses.data?.grandTotal != null && (
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {t('dashboard.periodTotal', {
                  amount: formatCurrency(expenses.data.grandTotal),
                })}
              </span>
            )}
          </CardHeader>
          <CardContent className="min-h-75">
            {expenseRows.length > 0 ? (
              <CategoryRanking
                items={expenseRows}
                title={expensesTitle}
                inverted
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
