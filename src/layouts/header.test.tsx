import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { Header } from './header'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'testuser', roles: ['ADMIN'] })
  )
})

describe('Header', () => {
  it('renders user dropdown trigger', () => {
    renderWithProviders(<Header />)
    expect(
      screen.getByRole('button', { name: /testuser/i })
    ).toBeInTheDocument()
  })

  it('shows page title for dashboard route', () => {
    renderWithProviders(<Header />, { route: '/' })
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('shows page title for donations route', () => {
    renderWithProviders(<Header />, { route: '/donations' })
    expect(screen.getByText('Donaciones')).toBeInTheDocument()
  })

  it('shows page title for nested edit route', () => {
    renderWithProviders(<Header />, { route: '/donations/3/edit' })
    expect(screen.getByText('Donaciones')).toBeInTheDocument()
  })

  it('shows page title for settings route', () => {
    renderWithProviders(<Header />, { route: '/settings/password' })
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument()
  })
})
