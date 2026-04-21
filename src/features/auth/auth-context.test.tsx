import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from './auth-context'

const AUTH_KEY = 'auth_user'

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  localStorage.clear()
})

describe('AuthProvider', () => {
  it('starts with null user when localStorage empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
  })

  it('rehydrates user from localStorage', () => {
    const stored = { username: 'admin', roles: ['ADMIN'] }
    localStorage.setItem(AUTH_KEY, JSON.stringify(stored))

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toEqual(stored)
  })

  it('login stores user in state and localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const user = { username: 'teso', roles: ['TREASURER'] }

    act(() => result.current.login(user))

    expect(result.current.user).toEqual(user)
    expect(JSON.parse(localStorage.getItem(AUTH_KEY)!)).toEqual(user)
  })

  it('logout clears user from state and localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => result.current.login({ username: 'admin', roles: ['ADMIN'] }))
    act(() => result.current.logout())

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(AUTH_KEY)).toBeNull()
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(AUTH_KEY, 'not-json{{{')

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(AUTH_KEY)).toBeNull()
  })
})

describe('useAuth outside provider', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within AuthProvider')
  })
})
