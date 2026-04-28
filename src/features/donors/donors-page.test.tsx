import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonorsPage } from './donors-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('DonorsPage', () => {
  it('renders page title and new donor button', () => {
    renderWithProviders(<DonorsPage />)
    expect(screen.getByText('Donantes')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Nuevo donante/ })
    ).toBeInTheDocument()
  })

  it('renders donor rows from API', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.getByText('12345678A')).toBeInTheDocument()
    expect(screen.getByText('87654321B')).toBeInTheDocument()
  })

  it('shows active/inactive badges', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('renders pagination info', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })
  })

  it('sort button changes sort indicator', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    // Default sort is fullName,asc — header shows ↑
    expect(screen.getByText(/Nombre completo/).textContent).toContain('↑')

    // Click to toggle to desc
    await user.click(screen.getByText(/Nombre completo/))
    await waitFor(() => {
      expect(screen.getByText(/Nombre completo/).textContent).toContain('↓')
    })
  })

  it('pagination buttons are disabled on single page', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
  })

  it('shows edit links for each row', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const editLinks = screen.getAllByRole('link')
    expect(editLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('toggles sort with Enter key on sortable header', async () => {
    renderWithProviders(<DonorsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    fireEvent.keyDown(
      screen.getByRole('columnheader', { name: /Nombre completo/ }),
      { key: 'Enter' }
    )
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Nombre completo/ })
      ).toHaveAttribute('aria-sort', 'descending')
    })
  })

  it('toggles sort with Space key on sortable header', async () => {
    renderWithProviders(<DonorsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    fireEvent.keyDown(
      screen.getByRole('columnheader', { name: /Nombre completo/ }),
      { key: ' ' }
    )
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Nombre completo/ })
      ).toHaveAttribute('aria-sort', 'descending')
    })
  })

  it('edit links have descriptive aria-labels', async () => {
    renderWithProviders(<DonorsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const editLink = screen.getAllByRole('link', { name: /Editar donante/ })
    expect(editLink[0]).toBeInTheDocument()
  })
})
