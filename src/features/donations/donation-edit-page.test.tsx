import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonationEditPage } from './donation-edit-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

// Mock useParams to return id=1
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  }
})

describe('DonationEditPage', () => {
  it('renders edit page title', async () => {
    renderWithProviders(<DonationEditPage />)

    await waitFor(() => {
      expect(screen.getByText('Editar donación')).toBeInTheDocument()
    })
  })

  it('loads existing donation data into form', async () => {
    renderWithProviders(<DonationEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Monto')).toHaveValue(100)
    })

    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-04-15')
  })

  it('renders Cancel button', async () => {
    renderWithProviders(<DonationEditPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cancelar' })
      ).toBeInTheDocument()
    })
  })

  it('opens confirmation dialog on form submit and saves on confirm', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonationEditPage />)

    // Wait for form to load with data
    await waitFor(() => {
      expect(screen.getByLabelText('Monto')).toHaveValue(100)
    })

    // Change amount and submit
    const amountInput = screen.getByLabelText('Monto')
    await user.clear(amountInput)
    await user.type(amountInput, '200')

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
    renderWithProviders(<DonationEditPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Monto')).toHaveValue(100)
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
