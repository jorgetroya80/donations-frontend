import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { currentMonthRange, formatCurrency } from './formatters'

const fmt = (s: string) => s.replace(/\s/g, ' ')

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(fmt(formatCurrency(0))).toBe('0,00 €')
  })

  it('formats positive integer', () => {
    expect(fmt(formatCurrency(1000))).toBe('1000,00 €')
  })

  it('formats decimal with fractional digits', () => {
    expect(fmt(formatCurrency(99.5))).toBe('99,50 €')
  })

  it('formats negative amount', () => {
    expect(fmt(formatCurrency(-250))).toBe('-250,00 €')
  })

  it('formats large amount with grouping separators', () => {
    expect(fmt(formatCurrency(1234567.89))).toBe('1.234.567,89 €')
  })
})

describe('currentMonthRange', () => {
  it('from equals start of current month', () => {
    const { from } = currentMonthRange()
    expect(from).toEqual(dayjs().startOf('month').toDate())
  })

  it('to equals end of current month', () => {
    const { to } = currentMonthRange()
    expect(to).toEqual(dayjs().endOf('month').toDate())
  })

  it('both values are Date instances', () => {
    const { from, to } = currentMonthRange()
    expect(from).toBeInstanceOf(Date)
    expect(to).toBeInstanceOf(Date)
  })
})
