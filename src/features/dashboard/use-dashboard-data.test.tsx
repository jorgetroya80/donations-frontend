import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  useBalance,
  useDonationSummary,
  useExpenseSummary,
} from './use-dashboard-data'

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

const dateRange = { from: '2026-04-01', to: '2026-04-30' }

describe('useBalance', () => {
  it('returns balance data', async () => {
    const { result } = renderHook(() => useBalance(dateRange), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      from: '2026-04-01',
      to: '2026-04-30',
      totalIncome: 5000,
      totalExpenses: 3000,
      netBalance: 2000,
    })
  })
})

describe('useDonationSummary', () => {
  it('returns donation summary data', async () => {
    const { result } = renderHook(() => useDonationSummary(dateRange), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.grandTotal).toBe(5000)
    expect(result.current.data?.totalsByType).toHaveLength(2)
  })
})

describe('useExpenseSummary', () => {
  it('returns expense summary data', async () => {
    const { result } = renderHook(() => useExpenseSummary(dateRange), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.grandTotal).toBe(3000)
    expect(result.current.data?.totalsByCategory).toHaveLength(2)
  })
})
