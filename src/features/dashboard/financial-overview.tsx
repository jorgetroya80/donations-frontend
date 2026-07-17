import dayjs from 'dayjs'
import { ArrowDownRight, ArrowUpRight, BarChart3, Scale } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { DateRangePicker } from '@/components/date-range-picker'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { currentMonthRange, formatCurrency } from '@/lib/formatters'
import { getProblemMessage } from '@/lib/get-problem-message'
import {
  useBalance,
  useDonationSummary,
  useExpenseSummary,
} from './use-dashboard-data'

function formatDate(d: Date) {
  return dayjs(d).format('YYYY-MM-DD')
}

function previousRange(from: Date, to: Date) {
  const days = dayjs(to).diff(dayjs(from), 'day') + 1
  return {
    from: dayjs(from).subtract(days, 'day').format('YYYY-MM-DD'),
    to: dayjs(from).subtract(1, 'day').format('YYYY-MM-DD'),
  }
}

function calcPctChange(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current == null || previous == null || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function PctChange({
  current,
  previous,
  inverted = false,
}: {
  current: number | null | undefined
  previous: number | null | undefined
  inverted?: boolean
}) {
  const pct = calcPctChange(current, previous)
  if (pct == null) return null
  const isPositive = pct > 0
  const isGood = inverted ? !isPositive : isPositive
  return (
    <span
      className={`mt-1 text-xs font-medium ${isGood ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

const donationChartConfig: ChartConfig = {
  TITHE: { label: 'Diezmo', color: 'var(--chart-1)' },
  OFFERING: { label: 'Ofrenda', color: 'var(--chart-2)' },
  SPECIAL_OFFERING: { label: 'Ofrenda especial', color: 'var(--chart-3)' },
  OTHER: { label: 'Otro', color: 'var(--chart-4)' },
}

const donationComparisonConfig: ChartConfig = {
  current: { label: 'Actual', color: 'var(--chart-1)' },
  previous: { label: 'Anterior', color: 'var(--chart-3)' },
}

const expenseCategoryLabels: Record<string, string> = {
  RENT: 'Alquiler',
  UTILITIES: 'Servicios',
  SALARIES: 'Salarios',
  SUPPLIES: 'Suministros',
  MISSIONS: 'Misiones',
  MAINTENANCE: 'Mantenimiento',
  OTHER: 'Otro',
}

const expenseChartConfig: ChartConfig = {
  current: { label: 'Actual', color: 'var(--chart-1)' },
  previous: { label: 'Anterior', color: 'var(--chart-3)' },
}

export function FinancialOverview() {
  const { t } = useTranslation()
  const [range, setRange] = useState(currentMonthRange)

  const dateParams = {
    from: formatDate(range.from),
    to: formatDate(range.to),
  }
  const prevDateParams = previousRange(range.from, range.to)

  const balance = useBalance(dateParams)
  const donations = useDonationSummary(dateParams)
  const expenses = useExpenseSummary(dateParams)
  const prevDonations = useDonationSummary(prevDateParams)
  const prevBalance = useBalance(prevDateParams)
  const prevExpenses = useExpenseSummary(prevDateParams)

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
      category: expenseCategoryLabels[cur.category ?? ''] ?? cur.category,
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
        <Card className="@container">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalIncome')}
            </CardTitle>
            <ArrowUpRight
              size={16}
              className="text-green-600 dark:text-green-400"
            />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl @max-3xs:text-lg">
              {balance.data
                ? formatCurrency(balance.data.totalIncome ?? 0)
                : '—'}
            </p>
            <PctChange
              current={balance.data?.totalIncome}
              previous={prevBalance.data?.totalIncome}
            />
          </CardContent>
        </Card>

        <Card className="@container">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalExpenses')}
            </CardTitle>
            <ArrowDownRight size={16} className="text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl @max-3xs:text-lg">
              {balance.data
                ? formatCurrency(balance.data.totalExpenses ?? 0)
                : '—'}
            </p>
            <PctChange
              current={balance.data?.totalExpenses}
              previous={prevBalance.data?.totalExpenses}
              inverted
            />
          </CardContent>
        </Card>

        <Card className="@container">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.netBalance')}
            </CardTitle>
            <Scale size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl @max-3xs:text-lg">
              {balance.data
                ? formatCurrency(balance.data.netBalance ?? 0)
                : '—'}
            </p>
            <PctChange
              current={balance.data?.netBalance}
              previous={prevBalance.data?.netBalance}
            />
          </CardContent>
        </Card>
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
                  <ChartContainer
                    config={donationComparisonConfig}
                    className="max-h-20"
                  >
                    <BarChart data={titheData} layout="vertical">
                      <YAxis
                        dataKey="type"
                        type="category"
                        width={120}
                        tickLine={false}
                        axisLine={false}
                      />
                      <XAxis type="number" hide />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(v) => formatCurrency(v as number)}
                          />
                        }
                      />
                      <Bar
                        dataKey="current"
                        fill="var(--color-current)"
                        radius={4}
                      />
                      <Bar
                        dataKey="previous"
                        fill="var(--color-previous)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
                {otherDonationsData.length > 0 && (
                  <ChartContainer
                    config={donationComparisonConfig}
                    className="max-h-45"
                  >
                    <BarChart data={otherDonationsData} layout="vertical">
                      <YAxis
                        dataKey="type"
                        type="category"
                        width={120}
                        tickLine={false}
                        axisLine={false}
                      />
                      <XAxis type="number" hide />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(v) => formatCurrency(v as number)}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="current"
                        fill="var(--color-current)"
                        radius={4}
                      />
                      <Bar
                        dataKey="previous"
                        fill="var(--color-previous)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
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
              <ChartContainer config={expenseChartConfig} className="max-h-75">
                <BarChart data={expenseChartData} layout="vertical">
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="current"
                    fill="var(--color-current)"
                    radius={4}
                  />
                  <Bar
                    dataKey="previous"
                    fill="var(--color-previous)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
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
