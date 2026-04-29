import { screen, waitFor, within } from '@testing-library/react'
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

  it('opens confirmation dialog on form submit and saves on confirm', async () => {
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

    // Confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText(/Confirmar cambios/i)).toBeInTheDocument()
    })

    // Click confirm
    await user.click(screen.getByRole('button', { name: /Confirmar/i }))

    await waitFor(() => {
      expect(screen.queryByText(/Confirmar cambios/i)).not.toBeInTheDocument()
    })
  })

  it('closes confirmation dialog on cancel', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre completo')).toHaveValue('Juan Pérez')
    })

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByText(/Confirmar cambios/i)).toBeInTheDocument()
    })

    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      within(dialog)
        .getByRole('button', { name: /Cancelar/i })
        .click()
    })

    await waitFor(() => {
      expect(screen.queryByText(/Confirmar cambios/i)).not.toBeInTheDocument()
    })
  })
})
