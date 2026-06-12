import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSort } from '@/lib/use-sort'

describe('useSort', () => {
  it('starts with the initial sort', () => {
    const { result } = renderHook(() => useSort('date,desc'))
    expect(result.current.sort).toBe('date,desc')
  })

  it('sorts a new field ascending', () => {
    const { result } = renderHook(() => useSort('date,desc'))
    act(() => result.current.toggleSort('amount'))
    expect(result.current.sort).toBe('amount,asc')
  })

  it('toggles direction on the same field', () => {
    const { result } = renderHook(() => useSort('date,desc'))
    act(() => result.current.toggleSort('date'))
    expect(result.current.sort).toBe('date,asc')
    act(() => result.current.toggleSort('date'))
    expect(result.current.sort).toBe('date,desc')
  })

  it('calls onSortChange when toggling', () => {
    const onSortChange = vi.fn()
    const { result } = renderHook(() => useSort('date,desc', onSortChange))
    act(() => result.current.toggleSort('amount'))
    expect(onSortChange).toHaveBeenCalledTimes(1)
  })

  it('returns the sort indicator for the active field only', () => {
    const { result } = renderHook(() => useSort('date,desc'))
    expect(result.current.sortIndicator('date')).toBe(' ↓')
    expect(result.current.sortIndicator('amount')).toBe('')
    act(() => result.current.toggleSort('date'))
    expect(result.current.sortIndicator('date')).toBe(' ↑')
  })

  it('returns aria-sort values', () => {
    const { result } = renderHook(() => useSort('date,desc'))
    expect(result.current.ariaSort('date')).toBe('descending')
    expect(result.current.ariaSort('amount')).toBe('none')
    act(() => result.current.toggleSort('date'))
    expect(result.current.ariaSort('date')).toBe('ascending')
  })
})
