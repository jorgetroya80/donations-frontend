import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  useCreateDonation,
  useDonation,
  useDonations,
  useDonors,
  useUpdateDonation,
} from './use-donations'

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

describe('useDonations', () => {
  it('returns paginated donation list', async () => {
    const { result } = renderHook(() => useDonations({ page: 0, size: 10 }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(2)
    expect(result.current.data?.totalElements).toBe(2)
  })
})

describe('useDonation', () => {
  it('returns single donation by id', async () => {
    const { result } = renderHook(() => useDonation(1), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
    expect(result.current.data?.amount).toBe(100)
  })
})

describe('useCreateDonation', () => {
  it('creates donation and returns response', async () => {
    const { result } = renderHook(() => useCreateDonation(), {
      wrapper: createWrapper(),
    })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>>
    await waitFor(async () => {
      response = await result.current.mutateAsync({
        amount: 100,
        donationDate: '2026-04-15',
        donationType: 'TITHE',
        paymentMethod: 'CASH',
      })
    })

    expect(response!.saved).toBe(true)
    expect(response!.donation.id).toBe(3)
  })
})

describe('useUpdateDonation', () => {
  it('updates donation', async () => {
    const { result } = renderHook(() => useUpdateDonation(1), {
      wrapper: createWrapper(),
    })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>>
    await waitFor(async () => {
      response = await result.current.mutateAsync({ amount: 200 })
    })

    expect(response!.amount).toBe(200)
  })
})

describe('useDonors', () => {
  it('returns donor list', async () => {
    const { result } = renderHook(() => useDonors(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(1)
    expect(result.current.data?.content[0].fullName).toBe('Juan Pérez')
  })
})
