import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ProtectedRoute } from './protected-route'

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<p>Login page</p>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<p>Dashboard</p>} />
        <Route
          path="/settings/password"
          element={<p>Change Password Screen</p>}
        />
      </Route>
    </Routes>
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithProviders(<TestApp />, { route: '/' })
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders outlet when authenticated', () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
    )
    renderWithProviders(<TestApp />, { route: '/' })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    localStorage.clear()
  })

  it('redirects to /settings/password when mustChangePassword=true', () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        username: 'admin',
        roles: ['ADMIN'],
        mustChangePassword: true,
      })
    )
    renderWithProviders(<TestApp />, { route: '/' })
    expect(screen.getByText('Change Password Screen')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    localStorage.clear()
  })

  it('allows access to /settings/password when flag is set', () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        username: 'admin',
        roles: ['ADMIN'],
        mustChangePassword: true,
      })
    )
    renderWithProviders(<TestApp />, { route: '/settings/password' })
    expect(screen.getByText('Change Password Screen')).toBeInTheDocument()
    localStorage.clear()
  })
})
