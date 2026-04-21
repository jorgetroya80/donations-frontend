import dayjs from 'dayjs'
import {
  ArrowDownRight,
  ArrowUpRight,
  HandCoins,
  Receipt,
  Scale,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Bar, BarChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { DateRangePicker } from '@/components/date-range-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  useBalance,
  useDonationSummary,
  useExpenseSummary,
} from './use-dashboard-data'

function currentMonthRange() {
  const from = dayjs().startOf('month').toDate()
  const to = dayjs().endOf('month').toDate()
  return { from, to }
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

const donationChartConfig: ChartConfig = {
  TITHE: { label: 'Diezmo', color: 'var(--chart-1)' },
  OFFERING: { label: 'Ofrenda', color: 'var(--chart-2)' },
  SPECIAL_OFFERING: { label: 'Ofrenda especial', color: 'var(--chart-3)' },
  OTHER: { label: 'Otro', color: 'var(--chart-4)' },
}

const expenseChartConfig: ChartConfig = {
  RENT: { label: 'Alquiler', color: 'var(--chart-1)' },
  UTILITIES: { label: 'Servicios', color: 'var(--chart-2)' },
  SALARIES: { label: 'Salarios', color: 'var(--chart-3)' },
  SUPPLIES: { label: 'Suministros', color: 'var(--chart-4)' },
  MISSIONS: { label: 'Misiones', color: 'var(--chart-5)' },
  MAINTENANCE: { label: 'Mantenimiento', color: 'var(--chart-1)' },
  OTHER: { label: 'Otro', color: 'var(--chart-2)' },
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [range, setRange] = useState(currentMonthRange)

  const dateParams = {
    from: formatDate(range.from),
    to: formatDate(range.to),
  }

  const balance = useBalance(dateParams)
  const donations = useDonationSummary(dateParams)
  const expenses = useExpenseSummary(dateParams)

  const isLoading =
    balance.isLoading || donations.isLoading || expenses.isLoading
  const error = balance.error || donations.error || expenses.error

  const donationChartData =
    donations.data?.totalsByType?.map((d) => ({
      name: donationChartConfig[d.type]?.label ?? d.type,
      value: d.total,
      fill: donationChartConfig[d.type]?.color ?? 'var(--chart-4)',
    })) ?? []

  const expenseChartData =
    expenses.data?.totalsByCategory?.map((e) => ({
      category: expenseChartConfig[e.category]?.label ?? e.category,
      total: e.total,
      fill: expenseChartConfig[e.category]?.color ?? 'var(--chart-4)',
    })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
        <div className="flex items-center gap-2">
          <DateRangePicker
            from={range.from}
            to={range.to}
            onChange={(from, to) => setRange({ from, to })}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t('dashboard.errorLoading')}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Alert>
          <AlertDescription>{t('common.loading')}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalIncome')}
            </CardTitle>
            <ArrowUpRight size={16} className="text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {balance.data ? formatCurrency(balance.data.totalIncome) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalExpenses')}
            </CardTitle>
            <ArrowDownRight size={16} className="text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {balance.data ? formatCurrency(balance.data.totalExpenses) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.netBalance')}
            </CardTitle>
            <Scale size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {balance.data ? formatCurrency(balance.data.netBalance) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => navigate('/donations/new')}>
          <HandCoins size={16} />
          {t('dashboard.newDonation')}
        </Button>
        <Button variant="outline" onClick={() => navigate('/expenses/new')}>
          <Receipt size={16} />
          {t('dashboard.newExpense')}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.donationsByType')}</CardTitle>
          </CardHeader>
          <CardContent>
            {donationChartData.length > 0 ? (
              <ChartContainer
                config={donationChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Pie
                    data={donationChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {t('dashboard.noData')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseChartData.length > 0 ? (
              <ChartContainer
                config={expenseChartConfig}
                className="max-h-[300px]"
              >
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
                  <Bar dataKey="total" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {t('dashboard.noData')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
