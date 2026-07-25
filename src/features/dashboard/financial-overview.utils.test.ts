import { describe, expect, it } from 'vitest'
import {
  calcPctChange,
  formatDate,
  previousRange,
} from './financial-overview.utils'

describe('formatDate', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-04-01T12:00:00'))).toBe('2026-04-01')
  })
})

describe('previousRange', () => {
  it('returns the equal-length period immediately before the given range', () => {
    const from = new Date('2026-04-01T00:00:00')
    const to = new Date('2026-04-30T00:00:00')
    expect(previousRange(from, to)).toEqual({
      from: '2026-03-02',
      to: '2026-03-31',
    })
  })

  it('handles a single-day range', () => {
    const day = new Date('2026-04-10T00:00:00')
    expect(previousRange(day, day)).toEqual({
      from: '2026-04-09',
      to: '2026-04-09',
    })
  })
})

describe('calcPctChange', () => {
  it('computes percentage change relative to the previous value', () => {
    expect(calcPctChange(150, 100)).toBe(50)
    expect(calcPctChange(50, 100)).toBe(-50)
  })

  it('returns null when either value is missing or previous is zero', () => {
    expect(calcPctChange(null, 100)).toBeNull()
    expect(calcPctChange(100, null)).toBeNull()
    expect(calcPctChange(100, 0)).toBeNull()
  })
})
