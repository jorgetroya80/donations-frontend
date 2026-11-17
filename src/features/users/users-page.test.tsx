import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '@/test/msw-server'
import { renderWithProviders } from '@/test/test-utils'

import { UsersPage } from './users-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('UsersPage', () => {
  it('renders page title and new user button', () => {
    renderWithProviders(<UsersPage />)
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Nuevo usuario/ })
    ).toBeInTheDocument()
  })

  it('renders user rows from API', async () => {
    renderWithProviders(<UsersPage />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    expect(screen.getByText('tesorero')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Tesorero')).toBeInTheDocument()
    expect(screen.getByText('Operador')).toBeInTheDocument()
  })

  it('shows active/inactive badges', async () => {
    renderWithProviders(<UsersPage />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    const activeBadges = screen.getAllByText('Activo')
    expect(activeBadges.length).toBe(2)
    for (const badge of activeBadges) {
      expect(badge).toHaveClass('bg-success-soft')
    }
  })

  it('shows inactive users with the secondary badge', async () => {
    server.use(
      http.get('*/api/v1/users', () =>
        HttpResponse.json({
          content: [
            {
              id: 3,
              username: 'antiguo',
              active: false,
              roles: ['OPERATOR'],
              mustChangePassword: false,
              createdAt: '2026-03-01T10:00:00',
              updatedAt: '2026-03-01T10:00:00',
            },
          ],
          page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
        })
      )
    )
    renderWithProviders(<UsersPage />)

    await waitFor(() => {
      expect(screen.getByText('antiguo')).toBeInTheDocument()
    })

    expect(screen.getByText('Inactivo')).toHaveClass('bg-secondary')
  })

  it('renders pagination info', async () => {
    renderWithProviders(<UsersPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })
  })

  it('sort button changes sort indicator', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    // Default sort is username,asc — header shows ↑
    expect(screen.getByText(/Nombre de usuario/).textContent).toContain('↑')

    // Click to toggle to desc
    await user.click(screen.getByText(/Nombre de usuario/))
    await waitFor(() => {
      expect(screen.getByText(/Nombre de usuario/).textContent).toContain('↓')
    })
  })

  it('pagination buttons are disabled on single page', async () => {
    renderWithProviders(<UsersPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
  })

  it('shows edit links for each row', async () => {
    renderWithProviders(<UsersPage />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    const editLinks = screen.getAllByRole('link')
    expect(editLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('toggles sort with Enter key on sortable header', async () => {
    renderWithProviders(<UsersPage />)
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    const sortButton = within(
      screen.getByRole('columnheader', { name: /Nombre de usuario/ })
    ).getByRole('button')
    sortButton.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Nombre de usuario/ })
      ).toHaveAttribute('aria-sort', 'descending')
    })
  })

  it('toggles sort with Space key on sortable header', async () => {
    renderWithProviders(<UsersPage />)
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    const sortButton = within(
      screen.getByRole('columnheader', { name: /Nombre de usuario/ })
    ).getByRole('button')
    sortButton.focus()
    await user.keyboard(' ')
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Nombre de usuario/ })
      ).toHaveAttribute('aria-sort', 'descending')
    })
  })

  it('shows pending-rotation badge for users with mustChangePassword=true', async () => {
    renderWithProviders(<UsersPage />)

    await waitFor(() => {
      expect(screen.getByText('tesorero')).toBeInTheDocument()
    })

    expect(
      screen.getByText('Pendiente de cambio de contraseña')
    ).toBeInTheDocument()
  })

  it('edit links have descriptive aria-labels', async () => {
    renderWithProviders(<UsersPage />)
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
    const editLink = screen.getAllByRole('link', { name: /Editar usuario/ })
    expect(editLink[0]).toBeInTheDocument()
  })
})
