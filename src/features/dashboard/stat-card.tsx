import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { calcPctChange } from './financial-overview.utils'

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
  // The previous-period queries resolve independently of the current-period
  // ones, so hold the line's space until they land or the card grows a row.
  if (pct == null)
    return (
      <span
        data-slot="pct-change"
        aria-hidden="true"
        className="invisible mt-1 text-xs font-medium"
      >
        &nbsp;
      </span>
    )
  const isPositive = pct > 0
  const isGood = inverted ? !isPositive : isPositive
  return (
    <span
      data-slot="pct-change"
      className={`mt-1 text-xs font-medium ${isGood ? 'text-success' : 'text-destructive'}`}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

interface StatCardProps {
  label: string
  icon: ReactNode
  value: number | undefined
  current: number | null | undefined
  previous: number | null | undefined
  inverted?: boolean
}

export function StatCard({
  label,
  icon,
  value,
  current,
  previous,
  inverted,
}: StatCardProps) {
  return (
    <Card className="@container">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-display-md @max-3xs:text-heading-md">
          {value != null ? formatCurrency(value) : '—'}
        </p>
        <PctChange current={current} previous={previous} inverted={inverted} />
      </CardContent>
    </Card>
  )
}
