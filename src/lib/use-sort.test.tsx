import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useSearchParams } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useSort } from '@/lib/use-sort'

function createWrapper(initialEntry = '/') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    )
  }
}

function renderUseSort(
  initialEntry = '/',
  defaultSort = 'date,desc',
  sortableFields = ['date', 'amount']
) {
  return renderHook(
    () => ({
      sort: useSort(defaultSort, sortableFields),
      searchParams: useSearchParams()[0],
    }),
    { wrapper: createWrapper(initialEntry) }
  )
}

describe('useSort', () => {
  it('starts with the default sort when the URL has no sort param', () => {
    const { result } = renderUseSort()
    expect(result.current.sort.sort).toBe('date,desc')
  })

  it('initializes from the sort URL param', () => {
    const { result } = renderUseSort('/?sort=amount,asc')
    expect(result.current.sort.sort).toBe('amount,asc')
  })

  it.each([
    'garbage',
    'unknown,asc',
    'amount,sideways',
  ])('falls back to the default sort for invalid param %s', (value) => {
    const { result } = renderUseSort(`/?sort=${value}`)
    expect(result.current.sort.sort).toBe('date,desc')
  })

  it('sorts a new field ascending', () => {
    const { result } = renderUseSort()
    act(() => result.current.sort.toggleSort('amount'))
    expect(result.current.sort.sort).toBe('amount,asc')
    expect(result.current.searchParams.get('sort')).toBe('amount,asc')
  })

  it('toggles direction on the same field', () => {
    const { result } = renderUseSort()
    act(() => result.current.sort.toggleSort('date'))
    expect(result.current.sort.sort).toBe('date,asc')
    act(() => result.current.sort.toggleSort('date'))
    expect(result.current.sort.sort).toBe('date,desc')
  })

  it('removes the sort param when toggling back to the default sort', () => {
    const { result } = renderUseSort('/?sort=date,asc')
    act(() => result.current.sort.toggleSort('date'))
    expect(result.current.sort.sort).toBe('date,desc')
    expect(result.current.searchParams.get('sort')).toBeNull()
  })

  it('deletes the page param when toggling sort', () => {
    const { result } = renderUseSort('/?page=3')
    act(() => result.current.sort.toggleSort('amount'))
    expect(result.current.searchParams.get('page')).toBeNull()
    expect(result.current.searchParams.get('sort')).toBe('amount,asc')
  })

  it('returns the sort indicator for the active field only', () => {
    const { result } = renderUseSort()
    expect(result.current.sort.sortIndicator('date')).toBe(' ↓')
    expect(result.current.sort.sortIndicator('amount')).toBe('')
    act(() => result.current.sort.toggleSort('date'))
    expect(result.current.sort.sortIndicator('date')).toBe(' ↑')
  })

  it('returns aria-sort values', () => {
    const { result } = renderUseSort()
    expect(result.current.sort.ariaSort('date')).toBe('descending')
    expect(result.current.sort.ariaSort('amount')).toBe('none')
    act(() => result.current.sort.toggleSort('date'))
    expect(result.current.sort.ariaSort('date')).toBe('ascending')
  })
})
