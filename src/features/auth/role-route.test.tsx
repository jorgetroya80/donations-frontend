import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import {
  canManageUsers,
  canRecordData,
  canViewReports,
} from '@/lib/permissions'
import { renderWithProviders } from '@/test/test-utils'
import { RoleRoute } from './role-route'

function setUser(username: string, roles: string[]) {
  localStorage.setItem('auth_user', JSON.stringify({ username, roles }))
}

describe('RoleRoute with canRecordData', () => {
  function render(route: string) {
    return renderWithProviders(
      <Routes>
        <Route element={<RoleRoute check={canRecordData} />}>
          <Route path="/donations" element={<div>Donations</div>} />
        </Route>
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>,
      { route }
    )
  }

  it('allows TREASURER', () => {
    setUser('tesorero', ['TREASURER'])
    render('/donations')
    expect(screen.getByText('Donations')).toBeInTheDocument()
  })

  it('allows OPERATOR', () => {
    setUser('operador', ['OPERATOR'])
    render('/donations')
    expect(screen.getByText('Donations')).toBeInTheDocument()
  })

  it('redirects ADMIN to dashboard', () => {
    setUser('admin', ['ADMIN'])
    render('/donations')
    expect(screen.queryByText('Donations')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects PASTOR to dashboard', () => {
    setUser('pastor', ['PASTOR'])
    render('/donations')
    expect(screen.queryByText('Donations')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('allows multi-role user with TREASURER', () => {
    setUser('multi', ['ADMIN', 'TREASURER'])
    render('/donations')
    expect(screen.getByText('Donations')).toBeInTheDocument()
  })
})

describe('RoleRoute with canViewReports', () => {
  function render(route: string) {
    return renderWithProviders(
      <Routes>
        <Route element={<RoleRoute check={canViewReports} />}>
          <Route path="/reports" element={<div>Reports</div>} />
        </Route>
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>,
      { route }
    )
  }

  it('allows TREASURER', () => {
    setUser('tesorero', ['TREASURER'])
    render('/reports')
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('allows PASTOR', () => {
    setUser('pastor', ['PASTOR'])
    render('/reports')
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('redirects ADMIN to dashboard', () => {
    setUser('admin', ['ADMIN'])
    render('/reports')
    expect(screen.queryByText('Reports')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects OPERATOR to dashboard', () => {
    setUser('operador', ['OPERATOR'])
    render('/reports')
    expect(screen.queryByText('Reports')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})

describe('RoleRoute with canManageUsers', () => {
  function render(route: string) {
    return renderWithProviders(
      <Routes>
        <Route element={<RoleRoute check={canManageUsers} />}>
          <Route path="/users" element={<div>Users</div>} />
        </Route>
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>,
      { route }
    )
  }

  it('allows ADMIN', () => {
    setUser('admin', ['ADMIN'])
    render('/users')
    expect(screen.getByText('Users')).toBeInTheDocument()
  })

  it('redirects TREASURER to dashboard', () => {
    setUser('tesorero', ['TREASURER'])
    render('/users')
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects OPERATOR to dashboard', () => {
    setUser('operador', ['OPERATOR'])
    render('/users')
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects PASTOR to dashboard', () => {
    setUser('pastor', ['PASTOR'])
    render('/users')
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('allows multi-role user with ADMIN', () => {
    setUser('multi', ['TREASURER', 'ADMIN'])
    render('/users')
    expect(screen.getByText('Users')).toBeInTheDocument()
  })
})
