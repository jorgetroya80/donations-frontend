import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  useCreateExpense,
  useExpense,
  useExpenses,
  useUpdateExpense,
} from './use-expenses'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useExpenses', () => {
  it('returns paginated expense list', async () => {
    const { result } = renderHook(() => useExpenses({ page: 0, size: 10 }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(2)
    expect(result.current.data?.content[0].category).toBe('RENT')
    expect(result.current.data?.totalElements).toBe(2)
  })
})

describe('useExpense', () => {
  it('returns single expense by id', async () => {
    const { result } = renderHook(() => useExpense(1), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.amount).toBe(500)
    expect(result.current.data?.category).toBe('RENT')
    expect(result.current.data?.description).toBe('Alquiler local abril')
  })

  it('does not fetch when id is 0', () => {
    const { result } = renderHook(() => useExpense(0), {
      wrapper: createWrapper(),
    })
    expect(result.current.isFetching).toBe(false)
  })
})

describe('useCreateExpense', () => {
  it('creates expense and returns response', async () => {
    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>>
    await waitFor(async () => {
      response = await result.current.mutateAsync({
        amount: 200,
        expenseDate: '2026-04-20',
        category: 'SUPPLIES',
        description: 'Material oficina',
        paymentMethod: 'CASH',
      })
    })

    expect(response!.id).toBe(3)
    expect(response!.amount).toBe(200)
    expect(response!.category).toBe('SUPPLIES')
  })
})

describe('useUpdateExpense', () => {
  it('updates expense', async () => {
    const { result } = renderHook(() => useUpdateExpense(1), {
      wrapper: createWrapper(),
    })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>>
    await waitFor(async () => {
      response = await result.current.mutateAsync({
        amount: 600,
        description: 'Alquiler actualizado',
      })
    })

    expect(response!.amount).toBe(600)
    expect(response!.description).toBe('Alquiler actualizado')
  })
})
