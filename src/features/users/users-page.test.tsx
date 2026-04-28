import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
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
    fireEvent.keyDown(
      screen.getByRole('columnheader', { name: /Nombre de usuario/ }),
      { key: 'Enter' }
    )
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
    fireEvent.keyDown(
      screen.getByRole('columnheader', { name: /Nombre de usuario/ }),
      { key: ' ' }
    )
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Nombre de usuario/ })
      ).toHaveAttribute('aria-sort', 'descending')
    })
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
