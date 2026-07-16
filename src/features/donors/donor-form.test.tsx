import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonorForm } from './donor-form'

describe('DonorForm', () => {
  it('renders all form fields', () => {
    renderWithProviders(<DonorForm onSubmit={vi.fn()} />)

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

    renderWithProviders(<DonorForm onSubmit={onSubmit} />)

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
          nationalId: '12345678A',
          email: 'juan@test.com',
        }}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Juan Pérez')
    expect(screen.getByLabelText('DNI/NIE')).toHaveValue('12345678A')
    expect(screen.getByLabelText(/Email/)).toHaveValue('juan@test.com')
  })

  it('renders Cancel button when onCancel is provided', () => {
    renderWithProviders(<DonorForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('Cancel button has type="button"', () => {
    renderWithProviders(<DonorForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute(
      'type',
      'button'
    )
  })

  it('clicking Cancel calls onCancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderWithProviders(<DonorForm onSubmit={vi.fn()} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('sets aria-invalid and aria-describedby on invalid submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorForm onSubmit={vi.fn()} />)

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
      expect(dniNieInput).toHaveAttribute(
        'aria-describedby',
        'nationalId-error'
      )
      expect(document.getElementById('nationalId-error')).toHaveAttribute(
        'role',
        'alert'
      )
    })
  })

  it('has no aria-invalid or aria-describedby before submit', () => {
    renderWithProviders(<DonorForm onSubmit={vi.fn()} />)

    const fullNameInput = screen.getByLabelText('Nombre completo')
    expect(fullNameInput).toHaveAttribute('aria-invalid', 'false')
    expect(fullNameInput).not.toHaveAttribute('aria-describedby')

    const nationalIdInput = screen.getByLabelText('DNI/NIE')
    expect(nationalIdInput).toHaveAttribute('aria-invalid', 'false')
    expect(nationalIdInput).not.toHaveAttribute('aria-describedby')
  })

  it('displays server field errors when onSubmit rejects', async () => {
    const user = userEvent.setup()
    const serverError = {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Validation failed',
      instance: '/api/v1/donors',
      fields: { nationalId: 'Formato de DNI/NIE inválido' },
    }
    const onSubmit = vi.fn().mockRejectedValue(serverError)

    renderWithProviders(<DonorForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nombre completo'), 'Juan Pérez')
    await user.type(screen.getByLabelText('DNI/NIE'), '99999999Z')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Formato de DNI/NIE inválido')
      ).toBeInTheDocument()
    })
  })

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    renderWithProviders(<DonorForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nombre completo'), 'Test Donor')
    await user.type(screen.getByLabelText('DNI/NIE'), '99999999Z')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Test Donor',
          nationalId: '99999999Z',
        })
      )
    })
  })
})
