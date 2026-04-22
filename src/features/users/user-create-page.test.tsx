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

  it('renders back button', () => {
    renderWithProviders(<UserCreatePage />)
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })

  it('shows success alert after successful creation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserCreatePage />)

    await user.type(screen.getByLabelText('Nombre de usuario'), 'newuser')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByText('Administrador'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Usuario creado exitosamente')
      ).toBeInTheDocument()
    })
  })
})
