import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { UserCreatePage } from './user-create-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('UserCreatePage', () => {
  it('renders create page title and form', () => {
    renderWithProviders(<UserCreatePage />)
    expect(screen.getByText('Nuevo usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument()
  })

  it('renders Cancel button', () => {
    renderWithProviders(<UserCreatePage />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})
