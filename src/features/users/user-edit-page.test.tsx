import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { UserEditPage } from './user-edit-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  }
})

describe('UserEditPage', () => {
  it('renders edit page title', async () => {
    renderWithProviders(<UserEditPage />)

    await waitFor(() => {
      expect(screen.getByText('Editar usuario')).toBeInTheDocument()
    })
  })

  it('loads existing user data into form', async () => {
    renderWithProviders(<UserEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre de usuario')).toHaveValue('admin')
    })

    expect(screen.getByLabelText('Activo')).toBeChecked()
  })

  it('renders Cancel button', async () => {
    renderWithProviders(<UserEditPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cancelar' })
      ).toBeInTheDocument()
    })
  })

  it('opens confirmation dialog on form submit and saves on confirm', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre de usuario')).toHaveValue('admin')
    })

    // Change username and submit
    const usernameInput = screen.getByLabelText('Nombre de usuario')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'admin_updated')

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
    renderWithProviders(<UserEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre de usuario')).toHaveValue('admin')
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
