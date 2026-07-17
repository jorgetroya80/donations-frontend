import { screen, waitFor } from '@testing-library/react'
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

  it('saves directly on submit and shows success toast', async () => {
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

    // No confirmation dialog; success toast appears
    await waitFor(() => {
      expect(
        screen.getByText('Gasto actualizado exitosamente')
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/Confirmar cambios/i)).not.toBeInTheDocument()
  })
})
