import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router'
import { renderWithProviders } from '@/test/test-utils'
import { AdminRoute } from './admin-route'

function TestChild() {
  return <div>Admin Content</div>
}

function renderWithRoute(initialRoute: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<AdminRoute />}>
        <Route path="/users" element={<TestChild />} />
      </Route>
      <Route path="/" element={<div>Dashboard</div>} />
    </Routes>,
    { route: initialRoute }
  )
}

describe('AdminRoute', () => {
  it('renders child route for ADMIN user', () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
    )
    renderWithRoute('/users')
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('redirects non-ADMIN user to dashboard', () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ username: 'operator', roles: ['OPERATOR'] })
    )
    renderWithRoute('/users')
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('allows multi-role user with ADMIN', () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ username: 'tesorero', roles: ['TREASURER', 'ADMIN'] })
    )
    renderWithRoute('/users')
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })
})
