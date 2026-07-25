import type { ReactNode } from 'react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/formatters'

// The category field (type/category) may carry a translated ReactNode label
// from the chart config, matching recharts' permissive data typing.
type ComparisonDatum = {
  current: number
  previous: number
} & Record<string, ReactNode>

export interface ComparisonBarChartProps {
  data: ComparisonDatum[]
  config: ChartConfig
  categoryKey: string
  categoryWidth: number
  showLegend?: boolean
  className?: string
}

export function ComparisonBarChart({
  data,
  config,
  categoryKey,
  categoryWidth,
  showLegend = false,
  className,
}: ComparisonBarChartProps) {
  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} layout="vertical">
        <YAxis
          dataKey={categoryKey}
          type="category"
          width={categoryWidth}
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
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        <Bar dataKey="current" fill="var(--color-current)" radius={4} />
        <Bar dataKey="previous" fill="var(--color-previous)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
