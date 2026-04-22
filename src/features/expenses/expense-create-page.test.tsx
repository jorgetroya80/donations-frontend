import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ExpenseCreatePage } from './expense-create-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

async function fillAndSubmitForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Monto'), '500')
  await user.type(screen.getByLabelText('Fecha'), '2026-04-10')
  await user.type(screen.getByLabelText('Descripción'), 'Test expense')

  // base-ui Select needs fireEvent.click (pointer-events issue in jsdom)
  const triggers = screen.getAllByRole('combobox')

  // Select category
  fireEvent.click(triggers[0])
  await waitFor(() => {
    expect(screen.getByText('Alquiler')).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText('Alquiler'))

  // Select payment method
  fireEvent.click(triggers[1])
  await waitFor(() => {
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText('Efectivo'))

  await user.click(screen.getByRole('button', { name: 'Guardar' }))
}

describe('ExpenseCreatePage', () => {
  it('renders create page title and form', () => {
    renderWithProviders(<ExpenseCreatePage />)
    expect(screen.getByText('Nuevo gasto')).toBeInTheDocument()
    expect(screen.getByLabelText('Monto')).toBeInTheDocument()
  })

  it('renders back button', () => {
    renderWithProviders(<ExpenseCreatePage />)
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })

  it('shows success alert after successful creation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpenseCreatePage />)

    await fillAndSubmitForm(user)

    await waitFor(() => {
      expect(screen.getByText('Gasto creado exitosamente')).toBeInTheDocument()
    })
  })
})
