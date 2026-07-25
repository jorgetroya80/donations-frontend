import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/msw-server'
import { useBalance } from './use-dashboard-data'

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

describe('useBalance - cancellation', () => {
  it('passes abort signal to request', async () => {
    let capturedSignal: AbortSignal | undefined
    server.use(
      http.get('*/api/v1/reports/balance', ({ request }) => {
        capturedSignal = request.signal
        return HttpResponse.json({
          from: dateRange.from,
          to: dateRange.to,
          totalIncome: 0,
          totalExpenses: 0,
          netBalance: 0,
        })
      })
    )

    const { result } = renderHook(() => useBalance(dateRange), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedSignal).toBeInstanceOf(AbortSignal)
  })
})
