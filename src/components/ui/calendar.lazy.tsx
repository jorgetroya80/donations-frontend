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

// Mirrors the real calendar's box, measured from the rendered DOM rather than
// derived: a month is 196px wide (7 cells at --cell-size 28) and 278px tall at
// six week rows — caption 28, gap 16, weekday row 18, six rows of 36 — over the
// footer line and the root's p-2.
//
// A month with five week rows is 242px, and the row count isn't knowable until
// the chunk lands, so this sizes for six. The popover can therefore shrink by a
// row on arrival but never grow, which is the direction that doesn't cover what
// the user is looking at.
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
            className="h-[278px] w-[calc(var(--cell-size)*7)] animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
      <div className="h-4" />
    </div>
  )
}
