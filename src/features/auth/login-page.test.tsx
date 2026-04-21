import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { LoginPage } from './login-page'

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Dashboard</p>} />
    </Routes>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('LoginPage', () => {
  it('renders login form', () => {
    renderWithProviders(<TestApp />, { route: '/login' })
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('redirects to dashboard on successful login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'admin')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'wrong')
    await user.type(screen.getByLabelText('Contraseña'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Usuario o contraseña incorrectos')
      ).toBeInTheDocument()
    })
  })

  it('stores user in localStorage after login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'admin')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('auth_user')!)
      expect(stored).toEqual({ username: 'admin', roles: ['ADMIN'] })
    })
  })
})
