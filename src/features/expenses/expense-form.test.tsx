import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ExpenseForm } from './expense-form'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('ExpenseForm', () => {
  const onSubmit = vi.fn()

  it('renders all form fields', () => {
    renderWithProviders(
      <ExpenseForm onSubmit={onSubmit} submitLabel="Guardar" />
    )

    expect(screen.getByLabelText('Monto')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument()
    expect(screen.getByLabelText('Proveedor (opcional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ExpenseForm onSubmit={onSubmit} submitLabel="Guardar" />
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      await screen.findByText(/expected number, received NaN/i)
    ).toBeInTheDocument()
    expect(screen.getByText('La fecha es obligatoria')).toBeInTheDocument()
    expect(
      screen.getByText('La descripción es obligatoria')
    ).toBeInTheDocument()
  })

  it('renders with default values in edit mode', () => {
    renderWithProviders(
      <ExpenseForm
        defaultValues={{
          amount: 500,
          expenseDate: '2026-04-10',
          category: 'RENT',
          description: 'Test expense',
          vendor: 'Test vendor',
          paymentMethod: 'CASH',
        }}
        onSubmit={onSubmit}
        submitLabel="Guardar"
      />
    )

    expect(screen.getByLabelText('Monto')).toHaveValue(500)
    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-04-10')
    expect(screen.getByText('Alquiler')).toBeInTheDocument()
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByLabelText('Descripción')).toHaveValue('Test expense')
    expect(screen.getByLabelText('Proveedor (opcional)')).toHaveValue(
      'Test vendor'
    )
  })

  it('shows loading state when submitting', () => {
    renderWithProviders(
      <ExpenseForm onSubmit={onSubmit} submitting submitLabel="Guardar" />
    )

    expect(screen.getByRole('button', { name: 'Cargando...' })).toBeDisabled()
  })

  it('sets aria-invalid and aria-describedby on invalid submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ExpenseForm onSubmit={onSubmit} submitLabel="Guardar" />
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const amountInput = screen.getByLabelText('Monto')
    expect(amountInput).toHaveAttribute('aria-invalid', 'true')
    expect(amountInput).toHaveAttribute('aria-describedby', 'amount-error')
    expect(document.getElementById('amount-error')).toHaveAttribute(
      'role',
      'alert'
    )

    const dateInput = screen.getByLabelText('Fecha')
    expect(dateInput).toHaveAttribute('aria-invalid', 'true')
    expect(dateInput).toHaveAttribute('aria-describedby', 'expenseDate-error')
    expect(document.getElementById('expenseDate-error')).toHaveAttribute(
      'role',
      'alert'
    )

    const descriptionInput = screen.getByLabelText('Descripción')
    expect(descriptionInput).toHaveAttribute('aria-invalid', 'true')
    expect(descriptionInput).toHaveAttribute(
      'aria-describedby',
      'description-error'
    )
    expect(document.getElementById('description-error')).toHaveAttribute(
      'role',
      'alert'
    )
  })

  it('has no aria-invalid or aria-describedby when no errors', () => {
    renderWithProviders(
      <ExpenseForm
        defaultValues={{
          amount: 100,
          expenseDate: '2026-04-10',
          description: 'Test',
        }}
        onSubmit={onSubmit}
        submitLabel="Guardar"
      />
    )

    const amountInput = screen.getByLabelText('Monto')
    expect(amountInput).toHaveAttribute('aria-invalid', 'false')
    expect(amountInput).not.toHaveAttribute('aria-describedby')

    const dateInput = screen.getByLabelText('Fecha')
    expect(dateInput).toHaveAttribute('aria-invalid', 'false')
    expect(dateInput).not.toHaveAttribute('aria-describedby')

    const descriptionInput = screen.getByLabelText('Descripción')
    expect(descriptionInput).toHaveAttribute('aria-invalid', 'false')
    expect(descriptionInput).not.toHaveAttribute('aria-describedby')
  })
})
