import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonationForm } from './donation-form'

const mockDonors = [
  {
    id: 1,
    fullName: 'Juan Pérez',
    dniNie: '12345678A',
    email: null,
    phone: null,
    address: null,
    active: true,
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-01T10:00:00',
  },
]

describe('DonationForm', () => {
  it('renders all form fields', () => {
    renderWithProviders(
      <DonationForm
        donors={mockDonors}
        onSubmit={vi.fn()}
        submitLabel="Guardar"
      />
    )

    expect(screen.getByLabelText('Monto')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
    expect(screen.getByLabelText(/Notas/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    renderWithProviders(
      <DonationForm
        donors={mockDonors}
        onSubmit={onSubmit}
        submitLabel="Guardar"
      />
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  it('sets aria-invalid and aria-describedby on invalid fields after submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DonationForm donors={mockDonors} onSubmit={vi.fn()} submitLabel="Guardar" />
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      const amountInput = screen.getByLabelText('Monto')
      expect(amountInput).toHaveAttribute('aria-invalid', 'true')
      expect(amountInput).toHaveAttribute('aria-describedby', 'amount-error')
      expect(document.getElementById('amount-error')).toHaveAttribute('role', 'alert')

      const dateInput = screen.getByLabelText('Fecha')
      expect(dateInput).toHaveAttribute('aria-invalid', 'true')
      expect(dateInput).toHaveAttribute('aria-describedby', 'donationDate-error')
      expect(document.getElementById('donationDate-error')).toHaveAttribute('role', 'alert')
    })
  })

  it('has no aria-invalid or aria-describedby before submit', () => {
    renderWithProviders(
      <DonationForm donors={mockDonors} onSubmit={vi.fn()} submitLabel="Guardar" />
    )

    const amountInput = screen.getByLabelText('Monto')
    expect(amountInput).toHaveAttribute('aria-invalid', 'false')
    expect(amountInput).not.toHaveAttribute('aria-describedby')

    const dateInput = screen.getByLabelText('Fecha')
    expect(dateInput).toHaveAttribute('aria-invalid', 'false')
    expect(dateInput).not.toHaveAttribute('aria-describedby')
  })

  it('renders with default values for edit mode', () => {
    renderWithProviders(
      <DonationForm
        defaultValues={{
          amount: 100,
          donationDate: '2026-04-15',
          donationType: 'TITHE',
          paymentMethod: 'CASH',
        }}
        donors={mockDonors}
        onSubmit={vi.fn()}
        submitLabel="Guardar"
      />
    )

    expect(screen.getByLabelText('Monto')).toHaveValue(100)
    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-04-15')
    expect(screen.getByText('Diezmo')).toBeInTheDocument()
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
  })
})
