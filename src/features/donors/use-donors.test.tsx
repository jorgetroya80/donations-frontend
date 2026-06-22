import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/msw-server'
import {
  useCreateDonor,
  useDonor,
  useDonors,
  useUpdateDonor,
} from './use-donors'

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

describe('useDonors', () => {
  it('returns paginated donor list', async () => {
    const { result } = renderHook(() => useDonors({ page: 0, size: 10 }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(2)
    expect(result.current.data?.content?.[0].fullName).toBe('Juan Pérez')
    expect(result.current.data?.page?.totalElements).toBe(2)
  })

  it('forwards the search param and returns the filtered subset', async () => {
    const { result } = renderHook(
      () => useDonors({ page: 0, size: 10, search: 'maría' }),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(1)
    expect(result.current.data?.content?.[0].fullName).toBe('María García')
  })
})

describe('useDonor', () => {
  it('returns single donor by id', async () => {
    const { result } = renderHook(() => useDonor(1), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
    expect(result.current.data?.fullName).toBe('Juan Pérez')
    expect(result.current.data?.nationalId).toBe('12345678A')
  })
})

describe('useCreateDonor', () => {
  it('creates donor and returns response', async () => {
    const { result } = renderHook(() => useCreateDonor(), {
      wrapper: createWrapper(),
    })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>>
    await waitFor(async () => {
      response = await result.current.mutateAsync({
        fullName: 'Test Donor',
        nationalId: '99999999Z',
      })
    })

    expect(response!.id).toBe(3)
    expect(response!.fullName).toBe('Test Donor')
  })
})

describe('useUpdateDonor', () => {
  it('updates donor', async () => {
    const { result } = renderHook(() => useUpdateDonor(1), {
      wrapper: createWrapper(),
    })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>>
    await waitFor(async () => {
      response = await result.current.mutateAsync({
        fullName: 'Juan Actualizado',
      })
    })

    expect(response!.fullName).toBe('Juan Actualizado')
  })
})

describe('useDonors - cancellation', () => {
  it('passes abort signal to request', async () => {
    let capturedSignal: AbortSignal | undefined
    server.use(
      http.get('*/api/v1/donors', ({ request }) => {
        capturedSignal = request.signal
        return HttpResponse.json({
          content: [],
          page: {
            size: 10,
            number: 0,
            totalElements: 0,
            totalPages: 0,
          },
        })
      })
    )

    const { result } = renderHook(() => useDonors({ page: 0, size: 10 }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedSignal).toBeInstanceOf(AbortSignal)
  })
})
