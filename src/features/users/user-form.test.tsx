import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { UserForm } from './user-form'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('UserForm — create mode', () => {
  const onSubmit = vi.fn()

  it('renders all form fields', () => {
    renderWithProviders(
      <UserForm mode="create" onSubmit={onSubmit} submitLabel="Guardar" />
    )

    expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Tesorero')).toBeInTheDocument()
    expect(screen.getByText('Pastor')).toBeInTheDocument()
    expect(screen.getByText('Operador')).toBeInTheDocument()
    expect(screen.getByLabelText('Activo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <UserForm mode="create" onSubmit={onSubmit} submitLabel="Guardar" />
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      await screen.findByText('El nombre de usuario es obligatorio')
    ).toBeInTheDocument()
    expect(
      screen.getByText('La contraseña debe tener al menos 8 caracteres')
    ).toBeInTheDocument()
    expect(screen.getByText('Seleccione al menos un rol')).toBeInTheDocument()
  })

  it('sets aria-invalid and aria-describedby on invalid submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <UserForm mode="create" onSubmit={vi.fn()} submitLabel="Guardar" />
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      const usernameInput = screen.getByLabelText('Nombre de usuario')
      expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
      expect(usernameInput).toHaveAttribute(
        'aria-describedby',
        'username-error'
      )
      expect(document.getElementById('username-error')).toHaveAttribute(
        'role',
        'alert'
      )

      const passwordInput = screen.getByLabelText('Contraseña')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
      expect(passwordInput).toHaveAttribute(
        'aria-describedby',
        'password-error'
      )
      expect(document.getElementById('password-error')).toHaveAttribute(
        'role',
        'alert'
      )

      expect(document.getElementById('roles-error')).toHaveAttribute(
        'role',
        'alert'
      )
    })
  })

  it('has no aria-describedby before submit', () => {
    renderWithProviders(
      <UserForm mode="create" onSubmit={vi.fn()} submitLabel="Guardar" />
    )

    const usernameInput = screen.getByLabelText('Nombre de usuario')
    expect(usernameInput).toHaveAttribute('aria-invalid', 'false')
    expect(usernameInput).not.toHaveAttribute('aria-describedby')

    const passwordInput = screen.getByLabelText('Contraseña')
    expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
    expect(passwordInput).not.toHaveAttribute('aria-describedby')
  })

  it('shows loading state when submitting', () => {
    renderWithProviders(
      <UserForm
        mode="create"
        onSubmit={onSubmit}
        submitting
        submitLabel="Guardar"
      />
    )

    expect(screen.getByRole('button', { name: 'Cargando...' })).toBeDisabled()
  })
})

describe('UserForm — edit mode', () => {
  const onSubmit = vi.fn()

  it('renders with default values', () => {
    renderWithProviders(
      <UserForm
        mode="edit"
        defaultValues={{
          username: 'admin',
          password: '',
          roles: ['ADMIN'],
          active: true,
        }}
        onSubmit={onSubmit}
        submitLabel="Guardar"
      />
    )

    expect(screen.getByLabelText('Nombre de usuario')).toHaveValue('admin')
    expect(screen.getByLabelText('Activo')).toBeChecked()
  })

  it('shows optional password label in edit mode', () => {
    renderWithProviders(
      <UserForm mode="edit" onSubmit={onSubmit} submitLabel="Guardar" />
    )

    expect(screen.getByText(/dejar vacío para no cambiar/)).toBeInTheDocument()
  })
})
