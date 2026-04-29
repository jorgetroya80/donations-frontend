import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ExpenseEditPage } from './expense-edit-page'

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

describe('ExpenseEditPage', () => {
  it('renders edit page title', async () => {
    renderWithProviders(<ExpenseEditPage />)

    await waitFor(() => {
      expect(screen.getByText('Editar gasto')).toBeInTheDocument()
    })
  })

  it('loads existing expense data into form', async () => {
    renderWithProviders(<ExpenseEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Monto')).toHaveValue(500)
    })

    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-04-10')
    expect(screen.getByLabelText('Descripción')).toHaveValue(
      'Alquiler local abril'
    )
    expect(screen.getByLabelText('Proveedor (opcional)')).toHaveValue(
      'Inmobiliaria López'
    )
  })

  it('renders Cancel button', async () => {
    renderWithProviders(<ExpenseEditPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cancelar' })
      ).toBeInTheDocument()
    })
  })

  it('opens confirmation dialog on form submit and saves on confirm', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpenseEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Monto')).toHaveValue(500)
    })

    // Change description and submit
    const descInput = screen.getByLabelText('Descripción')
    await user.clear(descInput)
    await user.type(descInput, 'Alquiler actualizado')

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
    renderWithProviders(<ExpenseEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Monto')).toHaveValue(500)
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
