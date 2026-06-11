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
    const stored = {
      username: 'admin',
      roles: ['ADMIN'],
      mustChangePassword: false,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(stored))

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toEqual(stored)
  })

  it('login stores user in state and localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const user = {
      username: 'teso',
      roles: ['TREASURER'],
      mustChangePassword: false,
    }

    act(() => result.current.login(user))

    expect(result.current.user).toEqual(user)
    expect(JSON.parse(localStorage.getItem(AUTH_KEY)!)).toEqual(user)
  })

  it('login persists mustChangePassword=true', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() =>
      result.current.login({
        username: 'admin',
        roles: ['ADMIN'],
        mustChangePassword: true,
      })
    )

    expect(result.current.user?.mustChangePassword).toBe(true)
  })

  it('clearMustChangePassword flips the flag and persists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() =>
      result.current.login({
        username: 'admin',
        roles: ['ADMIN'],
        mustChangePassword: true,
      })
    )
    act(() => result.current.clearMustChangePassword())

    expect(result.current.user?.mustChangePassword).toBe(false)
    expect(JSON.parse(localStorage.getItem(AUTH_KEY)!).mustChangePassword).toBe(
      false
    )
  })

  it('clearMustChangePassword is a no-op when user is null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => result.current.clearMustChangePassword())

    expect(result.current.user).toBeNull()
  })

  it('logout clears user from state and localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() =>
      result.current.login({
        username: 'admin',
        roles: ['ADMIN'],
        mustChangePassword: false,
      })
    )
    act(() => result.current.logout())

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(AUTH_KEY)).toBeNull()
  })

  it('flips mustChangePassword on auth:force-rotation event', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() =>
      result.current.login({
        username: 'admin',
        roles: ['ADMIN'],
        mustChangePassword: false,
      })
    )
    act(() => {
      window.dispatchEvent(new Event('auth:force-rotation'))
    })

    expect(result.current.user?.mustChangePassword).toBe(true)
  })

  it('ignores auth:force-rotation when no user is logged in', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      window.dispatchEvent(new Event('auth:force-rotation'))
    })

    expect(result.current.user).toBeNull()
  })

  it('defaults mustChangePassword to false when missing from legacy payload', () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ username: 'old', roles: ['ADMIN'] })
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toEqual({
      username: 'old',
      roles: ['ADMIN'],
      mustChangePassword: false,
    })
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
