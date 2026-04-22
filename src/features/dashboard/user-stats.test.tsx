import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { UserStats } from './user-stats'

describe('UserStats', () => {
  it('renders user management heading', () => {
    renderWithProviders(<UserStats />)
    expect(screen.getByText('Gestión de usuarios')).toBeInTheDocument()
  })

  it('displays total users count from API', async () => {
    renderWithProviders(<UserStats />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('renders manage users link', () => {
    renderWithProviders(<UserStats />)
    expect(
      screen.getByRole('button', { name: 'Administrar usuarios' })
    ).toBeInTheDocument()
  })
})
