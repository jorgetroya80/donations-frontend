import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonorCreatePage } from './donor-create-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('DonorCreatePage', () => {
  it('renders create page title and form', () => {
    renderWithProviders(<DonorCreatePage />)
    expect(screen.getByText('Nuevo donante')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
  })

  it('renders Cancel button', () => {
    renderWithProviders(<DonorCreatePage />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})
