import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useCreateUser, useUpdateUser, useUser, useUsers } from './use-users'

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

describe('useUsers', () => {
  it('returns paginated user list', async () => {
    const { result } = renderHook(() => useUsers({ page: 0, size: 10 }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(2)
    expect(result.current.data?.content[0].username).toBe('admin')
    expect(result.current.data?.totalElements).toBe(2)
  })
})

describe('useUser', () => {
  it('returns single user by id', async () => {
    const { result } = renderHook(() => useUser(1), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
    expect(result.current.data?.username).toBe('admin')
    expect(result.current.data?.roles).toEqual(['ADMIN'])
  })

  it('does not fetch when id is 0', () => {
    const { result } = renderHook(() => useUser(0), {
      wrapper: createWrapper(),
    })
    expect(result.current.isFetching).toBe(false)
  })
})

describe('useCreateUser', () => {
  it('creates user and returns response', async () => {
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>>
    await waitFor(async () => {
      response = await result.current.mutateAsync({
        username: 'newuser',
        password: 'password123',
        roles: ['OPERATOR'],
      })
    })

    expect(response!.id).toBe(3)
    expect(response!.username).toBe('newuser')
    expect(response!.roles).toEqual(['OPERATOR'])
  })
})

describe('useUpdateUser', () => {
  it('updates user', async () => {
    const { result } = renderHook(() => useUpdateUser(1), {
      wrapper: createWrapper(),
    })

    let response: Awaited<ReturnType<typeof result.current.mutateAsync>>
    await waitFor(async () => {
      response = await result.current.mutateAsync({
        username: 'admin_updated',
        roles: ['ADMIN', 'TREASURER'],
      })
    })

    expect(response!.username).toBe('admin_updated')
    expect(response!.roles).toEqual(['ADMIN', 'TREASURER'])
  })
})
