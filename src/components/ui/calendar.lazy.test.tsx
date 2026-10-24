import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Calendar, prefetchCalendar } from './calendar.lazy'

const JANUARY_2026 = new Date(2026, 0, 1)

describe('Calendar (lazy)', () => {
  // react-day-picker is ~29 KB gzip and only ever renders inside an open
  // popover, so the first paint is the fallback. It must hold the same box the
  // calendar will, or the popover resizes when the chunk lands.
  it('renders a placeholder sized to the month grid before the chunk loads', () => {
    const { container } = render(
      <Calendar mode="range" defaultMonth={JANUARY_2026} numberOfMonths={2} />
    )

    const placeholders = container.querySelectorAll('.animate-pulse')
    expect(placeholders).toHaveLength(2)
    expect(
      container.querySelector('[data-slot="calendar-fallback"]')
    ).toHaveClass('p-2')

    // Measured against the rendered calendar: 196px wide (7 cells) by 278px
    // tall at six week rows. These are the whole point of the fallback - if
    // they drift the popover resizes when the chunk lands.
    for (const placeholder of placeholders) {
      expect(placeholder).toHaveClass(
        'h-[278px]',
        'w-[calc(var(--cell-size)*7)]'
      )
    }
  })

  it('renders one placeholder month by default', () => {
    const { container } = render(<Calendar mode="single" />)

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(1)
  })

  // The first import transforms react-day-picker, which takes about a second
  // alone and over 5s under a loaded full run. Await it outside waitFor, under
  // its own test timeout, so the polling only covers the fallback swap.
  it('renders the calendar once the chunk resolves', async () => {
    await prefetchCalendar()

    const { container } = render(
      <Calendar mode="range" defaultMonth={JANUARY_2026} numberOfMonths={2} />
    )

    await waitFor(() => {
      expect(container.querySelectorAll('[data-day]').length).toBeGreaterThan(0)
    })
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
  }, 30_000)

  it('prefetches the chunk without rendering anything', async () => {
    await expect(prefetchCalendar()).resolves.toHaveProperty('Calendar')
  })
})
