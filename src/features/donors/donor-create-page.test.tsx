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

  it('renders back button', () => {
    renderWithProviders(<DonorCreatePage />)
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })

  it('shows success alert after successful creation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorCreatePage />)

    await user.type(screen.getByLabelText('Nombre completo'), 'Test Donor')
    await user.type(screen.getByLabelText('DNI/NIE'), '99999999Z')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Donante creado exitosamente')
      ).toBeInTheDocument()
    })
  })
})
