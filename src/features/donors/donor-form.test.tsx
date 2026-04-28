import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonorForm } from './donor-form'

describe('DonorForm', () => {
  it('renders all form fields', () => {
    renderWithProviders(<DonorForm onSubmit={vi.fn()} submitLabel="Guardar" />)

    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
    expect(screen.getByLabelText('DNI/NIE')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Dirección/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    renderWithProviders(<DonorForm onSubmit={onSubmit} submitLabel="Guardar" />)

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
    })

    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El DNI/NIE es obligatorio')).toBeInTheDocument()
  })

  it('renders with default values for edit mode', () => {
    renderWithProviders(
      <DonorForm
        defaultValues={{
          fullName: 'Juan Pérez',
          dniNie: '12345678A',
          email: 'juan@test.com',
        }}
        onSubmit={vi.fn()}
        submitLabel="Guardar"
      />
    )

    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Juan Pérez')
    expect(screen.getByLabelText('DNI/NIE')).toHaveValue('12345678A')
    expect(screen.getByLabelText(/Email/)).toHaveValue('juan@test.com')
  })

  it('sets aria-invalid and aria-describedby on invalid submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorForm onSubmit={vi.fn()} submitLabel="Guardar" />)

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      const fullNameInput = screen.getByLabelText('Nombre completo')
      expect(fullNameInput).toHaveAttribute('aria-invalid', 'true')
      expect(fullNameInput).toHaveAttribute(
        'aria-describedby',
        'fullName-error'
      )
      expect(document.getElementById('fullName-error')).toHaveAttribute(
        'role',
        'alert'
      )

      const dniNieInput = screen.getByLabelText('DNI/NIE')
      expect(dniNieInput).toHaveAttribute('aria-invalid', 'true')
      expect(dniNieInput).toHaveAttribute('aria-describedby', 'dniNie-error')
      expect(document.getElementById('dniNie-error')).toHaveAttribute(
        'role',
        'alert'
      )
    })
  })

  it('has no aria-invalid or aria-describedby before submit', () => {
    renderWithProviders(<DonorForm onSubmit={vi.fn()} submitLabel="Guardar" />)

    const fullNameInput = screen.getByLabelText('Nombre completo')
    expect(fullNameInput).toHaveAttribute('aria-invalid', 'false')
    expect(fullNameInput).not.toHaveAttribute('aria-describedby')

    const dniNieInput = screen.getByLabelText('DNI/NIE')
    expect(dniNieInput).toHaveAttribute('aria-invalid', 'false')
    expect(dniNieInput).not.toHaveAttribute('aria-describedby')
  })

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    renderWithProviders(<DonorForm onSubmit={onSubmit} submitLabel="Guardar" />)

    await user.type(screen.getByLabelText('Nombre completo'), 'Test Donor')
    await user.type(screen.getByLabelText('DNI/NIE'), '99999999Z')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Test Donor',
          dniNie: '99999999Z',
        }),
        expect.anything()
      )
    })
  })
})
