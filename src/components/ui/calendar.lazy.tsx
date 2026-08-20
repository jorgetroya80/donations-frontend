import { type ComponentProps, lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'
import type { Calendar as CalendarComponent } from './calendar'

type CalendarProps = ComponentProps<typeof CalendarComponent>

// react-day-picker is 29 KB gzip and the calendar only ever renders inside an
// open popover, so it loads on demand rather than on every route that carries a
// date range picker.
const LazyCalendar = lazy(() =>
  import('./calendar').then((m) => ({ default: m.Calendar }))
)

// Warm the chunk from a trigger's hover/focus so the popover usually opens with
// the calendar already resident.
export function prefetchCalendar() {
  return import('./calendar')
}

export function Calendar({ className, ...props }: CalendarProps) {
  const months = props.numberOfMonths ?? 1

  return (
    <Suspense
      fallback={<CalendarFallback months={months} className={className} />}
    >
      <LazyCalendar className={className} {...props} />
    </Suspense>
  )
}

// Mirrors the real calendar's box: same padding, same --cell-size, and a block
// per month sized to the grid it will hold — a caption row, a weekday row and
// six week rows, with the gap-4 between caption and grid.
function CalendarFallback({
  months,
  className,
}: {
  months: number
  className?: string
}) {
  return (
    <div
      data-slot="calendar-fallback"
      aria-hidden="true"
      className={cn('bg-background p-2 [--cell-size:--spacing(7)]', className)}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        {Array.from({ length: months }, (_, i) => (
          <div
            key={i}
            className="h-[calc(var(--cell-size)*8+1rem)] w-[calc(var(--cell-size)*7)] animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    </div>
  )
}
