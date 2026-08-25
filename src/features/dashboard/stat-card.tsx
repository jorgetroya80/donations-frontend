import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { PctChange } from './pct-change'

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
        <p className="font-bold text-2xl @max-3xs:text-lg">
          {value != null ? formatCurrency(value) : '—'}
        </p>
        <PctChange current={current} previous={previous} inverted={inverted} />
      </CardContent>
    </Card>
  )
}
