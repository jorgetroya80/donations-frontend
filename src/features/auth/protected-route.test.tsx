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
})
