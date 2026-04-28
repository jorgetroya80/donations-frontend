import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonationsPage } from './donations-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('DonationsPage', () => {
  it('renders page title and new donation button', () => {
    renderWithProviders(<DonationsPage />)
    expect(screen.getByText('Donaciones')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Nueva donación/ })
    ).toBeInTheDocument()
  })

  it('renders donation rows from API', async () => {
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    expect(screen.getByText('Anónimo')).toBeInTheDocument()
    expect(screen.getByText('Diezmo')).toBeInTheDocument()
    expect(screen.getByText('Ofrenda')).toBeInTheDocument()
  })

  it('renders pagination info', async () => {
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })
  })

  it('sort button changes sort indicator', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const dateHeader = screen.getByText(/Fecha/)
    await user.click(dateHeader)
    await waitFor(() => {
      expect(screen.getByText(/Fecha/).textContent).toContain('↑')
    })
  })

  it('sort by amount column', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const amountHeader = screen.getByText(/Monto/)
    await user.click(amountHeader)
    await waitFor(() => {
      expect(screen.getByText(/Monto/).textContent).toContain('↑')
    })
  })

  it('pagination buttons are rendered and disabled on single page', async () => {
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
  })

  it('shows edit links for each row', async () => {
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const editLinks = screen.getAllByRole('link')
    expect(editLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('toggles sort with Enter key on sortable header', async () => {
    renderWithProviders(<DonationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    fireEvent.keyDown(screen.getByRole('columnheader', { name: /Fecha/ }), {
      key: 'Enter',
    })
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Fecha/ })
      ).toHaveAttribute('aria-sort', 'ascending')
    })
  })

  it('toggles sort with Space key on sortable header', async () => {
    renderWithProviders(<DonationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    fireEvent.keyDown(screen.getByRole('columnheader', { name: /Fecha/ }), {
      key: ' ',
    })
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Fecha/ })
      ).toHaveAttribute('aria-sort', 'ascending')
    })
  })

  it('edit links have descriptive aria-labels', async () => {
    renderWithProviders(<DonationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const editLinks = screen.getAllByRole('link', { name: /Editar donación/ })
    expect(editLinks[0]).toBeInTheDocument()
  })
})
