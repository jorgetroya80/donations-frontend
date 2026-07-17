import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonorEditPage } from './donor-edit-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

// Mock useParams to return id=1
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  }
})

describe('DonorEditPage', () => {
  it('renders edit page title', async () => {
    renderWithProviders(<DonorEditPage />)

    await waitFor(() => {
      expect(screen.getByText('Editar donante')).toBeInTheDocument()
    })
  })

  it('loads existing donor data into form', async () => {
    renderWithProviders(<DonorEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre completo')).toHaveValue('Juan Pérez')
    })

    expect(screen.getByLabelText('DNI/NIE')).toHaveValue('12345678A')
    expect(screen.getByLabelText(/Email/)).toHaveValue('juan@test.com')
  })

  it('renders Cancel button', async () => {
    renderWithProviders(<DonorEditPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cancelar' })
      ).toBeInTheDocument()
    })
  })

  it('saves directly on submit and shows success toast', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre completo')).toHaveValue('Juan Pérez')
    })

    // Change name and submit
    const nameInput = screen.getByLabelText('Nombre completo')
    await user.clear(nameInput)
    await user.type(nameInput, 'Juan Actualizado')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // No confirmation dialog; success toast appears
    await waitFor(() => {
      expect(
        screen.getByText('Donante actualizado exitosamente')
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/Confirmar cambios/i)).not.toBeInTheDocument()
  })
})
