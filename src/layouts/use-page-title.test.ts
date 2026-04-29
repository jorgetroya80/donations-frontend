import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createWrapper } from '@/test/test-utils'
import { usePageTitle } from './use-page-title'

describe('usePageTitle', () => {
  it.each([
    ['/', 'Inicio'],
    ['/donations', 'Donaciones'],
    ['/donations/new', 'Donaciones'],
    ['/donations/3/edit', 'Donaciones'],
    ['/donors', 'Donantes'],
    ['/donors/new', 'Donantes'],
    ['/donors/5/edit', 'Donantes'],
    ['/expenses', 'Gastos'],
    ['/expenses/new', 'Gastos'],
    ['/expenses/7/edit', 'Gastos'],
    ['/reports', 'Reportes'],
    ['/users', 'Usuarios'],
    ['/users/new', 'Usuarios'],
    ['/users/2/edit', 'Usuarios'],
    ['/settings/password', 'Cambiar contraseña'],
  ])('route %s → %s', (route, expected) => {
    const { result } = renderHook(() => usePageTitle(), {
      wrapper: createWrapper({ route }),
    })
    expect(result.current).toBe(expected)
  })
})
