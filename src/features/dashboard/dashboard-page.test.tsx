import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DashboardPage } from './dashboard-page'

vi.mock('./financial-overview', () => ({
  FinancialOverview: () => <div data-testid="financial-overview" />,
}))
vi.mock('./user-stats', () => ({
  UserStats: () => <div data-testid="user-stats" />,
}))
vi.mock('./quick-actions', () => ({
  QuickActions: () => <div data-testid="quick-actions" />,
}))

const AUTH_KEY = 'auth_user'

function loginAs(roles: string[]) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ username: 'test', roles }))
}

beforeEach(() => {
  localStorage.clear()
})

describe('DashboardPage', () => {
  it('TREASURER sees financial overview + quick actions', () => {
    loginAs(['TREASURER'])
    renderWithProviders(<DashboardPage />)

    expect(screen.getByTestId('financial-overview')).toBeInTheDocument()
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
    expect(screen.queryByTestId('user-stats')).not.toBeInTheDocument()
  })

  it('PASTOR sees financial overview only', () => {
    loginAs(['PASTOR'])
    renderWithProviders(<DashboardPage />)

    expect(screen.getByTestId('financial-overview')).toBeInTheDocument()
    expect(screen.queryByTestId('user-stats')).not.toBeInTheDocument()
    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument()
  })

  it('ADMIN sees user stats + quick actions', () => {
    loginAs(['ADMIN'])
    renderWithProviders(<DashboardPage />)

    expect(screen.getByTestId('user-stats')).toBeInTheDocument()
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
    expect(screen.queryByTestId('financial-overview')).not.toBeInTheDocument()
  })

  it('OPERATOR sees quick actions only', () => {
    loginAs(['OPERATOR'])
    renderWithProviders(<DashboardPage />)

    expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
    expect(screen.queryByTestId('financial-overview')).not.toBeInTheDocument()
    expect(screen.queryByTestId('user-stats')).not.toBeInTheDocument()
  })

  it('ADMIN+TREASURER sees all widgets', () => {
    loginAs(['ADMIN', 'TREASURER'])
    renderWithProviders(<DashboardPage />)

    expect(screen.getByTestId('financial-overview')).toBeInTheDocument()
    expect(screen.getByTestId('user-stats')).toBeInTheDocument()
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
  })

  it('user with no matching roles sees welcome message', () => {
    loginAs([])
    renderWithProviders(<DashboardPage />)

    expect(screen.queryByTestId('financial-overview')).not.toBeInTheDocument()
    expect(screen.queryByTestId('user-stats')).not.toBeInTheDocument()
    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument()
    expect(screen.getByText(/Bienvenido/)).toBeInTheDocument()
  })
})
