import { screen, waitFor } from '@testing-library/react'
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

  it('saves directly on submit and shows success toast', async () => {
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

    // No confirmation dialog; success toast appears
    await waitFor(() => {
      expect(
        screen.getByText('Usuario actualizado exitosamente')
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/Confirmar cambios/i)).not.toBeInTheDocument()
  })
})
