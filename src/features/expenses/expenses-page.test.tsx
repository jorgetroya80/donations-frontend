import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ExpensesPage } from './expenses-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('ExpensesPage', () => {
  it('renders page title and new expense button', () => {
    renderWithProviders(<ExpensesPage />)
    expect(screen.getByText('Gastos')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Nuevo gasto/ })
    ).toBeInTheDocument()
  })

  it('renders expense rows from API', async () => {
    renderWithProviders(<ExpensesPage />)

    await waitFor(() => {
      expect(screen.getByText('Alquiler local abril')).toBeInTheDocument()
    })

    expect(screen.getByText('Factura electricidad')).toBeInTheDocument()
    expect(screen.getByText('Alquiler')).toBeInTheDocument()
    expect(screen.getByText('Servicios')).toBeInTheDocument()
  })

  it('renders pagination info', async () => {
    renderWithProviders(<ExpensesPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })
  })

  it('sort button changes sort indicator', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpensesPage />)

    await waitFor(() => {
      expect(screen.getByText('Alquiler local abril')).toBeInTheDocument()
    })

    // Default sort is expenseDate,desc — header shows ↓
    expect(screen.getByText(/Fecha/).textContent).toContain('↓')

    // Click to toggle to asc
    await user.click(screen.getByText(/Fecha/))
    await waitFor(() => {
      expect(screen.getByText(/Fecha/).textContent).toContain('↑')
    })
  })

  it('pagination buttons are disabled on single page', async () => {
    renderWithProviders(<ExpensesPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
  })

  it('shows edit links for each row', async () => {
    renderWithProviders(<ExpensesPage />)

    await waitFor(() => {
      expect(screen.getByText('Alquiler local abril')).toBeInTheDocument()
    })

    const editLinks = screen.getAllByRole('link')
    expect(editLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('toggles sort with Enter key on sortable header', async () => {
    renderWithProviders(<ExpensesPage />)
    await waitFor(() => {
      expect(screen.getByText('Alquiler local abril')).toBeInTheDocument()
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
    renderWithProviders(<ExpensesPage />)
    await waitFor(() => {
      expect(screen.getByText('Alquiler local abril')).toBeInTheDocument()
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
    renderWithProviders(<ExpensesPage />)
    await waitFor(() => {
      expect(screen.getByText('Alquiler local abril')).toBeInTheDocument()
    })
    const editLinks = screen.getAllByRole('link', { name: /Editar gasto/ })
    expect(editLinks[0]).toBeInTheDocument()
  })
})
