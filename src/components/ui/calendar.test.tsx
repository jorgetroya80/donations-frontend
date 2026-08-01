import { act, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Calendar } from './calendar'

// January 2026 is fixed so the grid is deterministic:
// 2026-01-14 is a Wednesday, its week runs Sun 2026-01-11 .. Sat 2026-01-17.
const JANUARY_2026 = new Date(2026, 0, 1)
const START = '2026-01-14'

function renderCalendar() {
  const { container } = render(
    <Calendar mode="single" defaultMonth={JANUARY_2026} />
  )

  // react-day-picker sets data-day="yyyy-MM-dd" on the gridcell.
  function dayButton(isoDate: string): HTMLButtonElement {
    const button = container.querySelector<HTMLButtonElement>(
      `[data-day="${isoDate}"] button`
    )
    if (!button) throw new Error(`No day button rendered for ${isoDate}`)
    return button
  }

  // DayPicker tracks the focused day in state, so a bare .focus() updates it
  // outside React's knowledge and warns. act() flushes that update.
  function focusDay(isoDate: string) {
    act(() => dayButton(isoDate).focus())
  }

  return { container, dayButton, focusDay }
}

describe('Calendar keyboard navigation', () => {
  it('does not steal focus on mount', () => {
    renderCalendar()
    expect(document.body).toHaveFocus()
  })

  it.each([
    ['{ArrowRight}', '2026-01-15'],
    ['{ArrowLeft}', '2026-01-13'],
    ['{ArrowDown}', '2026-01-21'],
    ['{ArrowUp}', '2026-01-07'],
    ['{Home}', '2026-01-11'],
    ['{End}', '2026-01-17'],
  ])('moves DOM focus to %s -> %s', async (key, expected) => {
    const user = userEvent.setup()
    const { dayButton, focusDay } = renderCalendar()

    focusDay(START)
    await user.keyboard(key)

    expect(dayButton(expected)).toHaveFocus()
  })

  it.each([
    ['{PageUp}', '2025-12-14'],
    ['{PageDown}', '2026-02-14'],
  ])('navigates months with %s and focuses %s', async (key, expected) => {
    const user = userEvent.setup()
    const { dayButton, focusDay } = renderCalendar()

    focusDay(START)
    await user.keyboard(key)

    await waitFor(() => {
      expect(dayButton(expected)).toHaveFocus()
    })
  })

  it('moves the focused gridcell marker along with DOM focus', async () => {
    const user = userEvent.setup()
    const { dayButton, focusDay } = renderCalendar()

    focusDay(START)
    await user.keyboard('{ArrowRight}')

    const moved = dayButton('2026-01-15')
    expect(moved).toHaveFocus()
    expect(moved.closest('td')).toHaveAttribute('data-focused', 'true')
    expect(dayButton(START).closest('td')).not.toHaveAttribute('data-focused')
  })
})
