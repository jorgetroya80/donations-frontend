import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useSearchParams } from 'react-router'
import { describe, expect, it } from 'vitest'
import { usePageParam } from '@/lib/use-page-param'

function createWrapper(initialEntry = '/') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    )
  }
}

function renderUsePageParam(initialEntry = '/') {
  return renderHook(
    () => ({
      page: usePageParam(),
      searchParams: useSearchParams()[0],
    }),
    { wrapper: createWrapper(initialEntry) }
  )
}

describe('usePageParam', () => {
  it('defaults to page 0 when the URL has no page param', () => {
    const { result } = renderUsePageParam()
    expect(result.current.page.page).toBe(0)
  })

  it('reads a 1-based page param as 0-based state', () => {
    const { result } = renderUsePageParam('/?page=3')
    expect(result.current.page.page).toBe(2)
  })

  it.each([
    '1',
    '0',
    '-2',
    '1.5',
    '2abc',
    'garbage',
  ])('falls back to page 0 for param %s', (value) => {
    const { result } = renderUsePageParam(`/?page=${value}`)
    expect(result.current.page.page).toBe(0)
  })

  it('writes the page as a 1-based param', () => {
    const { result } = renderUsePageParam()
    act(() => result.current.page.setPage(2))
    expect(result.current.page.page).toBe(2)
    expect(result.current.searchParams.get('page')).toBe('3')
  })

  it('removes the param when returning to the first page', () => {
    const { result } = renderUsePageParam('/?page=3')
    act(() => result.current.page.setPage(0))
    expect(result.current.page.page).toBe(0)
    expect(result.current.searchParams.get('page')).toBeNull()
  })

  it('keeps unrelated params intact when paging', () => {
    const { result } = renderUsePageParam('/?sort=amount,asc')
    act(() => result.current.page.setPage(1))
    expect(result.current.searchParams.get('sort')).toBe('amount,asc')
    expect(result.current.searchParams.get('page')).toBe('2')
  })
})
