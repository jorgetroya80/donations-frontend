import { lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'
import type { ComparisonBarChartProps } from './comparison-bar-chart'

// recharts is ~100 KB gzip and the dashboard is the landing route, so the
// chart loads after the page shell rather than blocking it.
const Chart = lazy(() =>
  import('./comparison-bar-chart').then((m) => ({
    default: m.ComparisonBarChart,
  }))
)

export function ComparisonBarChart(props: ComparisonBarChartProps) {
  return (
    <Suspense
      fallback={
        // Mirrors ChartContainer's box (aspect-video + the caller's max-h-*)
        // so swapping the chart in doesn't shift the layout.
        <div
          aria-hidden="true"
          className={cn(
            'aspect-video animate-pulse rounded-md bg-muted',
            props.className
          )}
        />
      }
    >
      <Chart {...props} />
    </Suspense>
  )
}
