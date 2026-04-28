import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ChangePasswordPage } from './change-password-page'

function renderPage() {
  return renderWithProviders(<ChangePasswordPage />)
}

describe('ChangePasswordPage', () => {
  it('renders form fields', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cambiar contraseña' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument()
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Confirmar nueva contraseña')
    ).toBeInTheDocument()
  })

  it('shows validation error for empty current password', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => {
      expect(
        screen.getByText('La contraseña actual es obligatoria')
      ).toBeInTheDocument()
    })
  })

  it('shows validation error for short new password', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Contraseña actual'), 'oldpass123')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'short')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => {
      expect(
        screen.getByText('La contraseña debe tener al menos 8 caracteres')
      ).toBeInTheDocument()
    })
  })

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Contraseña actual'), 'oldpass123')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'newpass123')
    await user.type(
      screen.getByLabelText('Confirmar nueva contraseña'),
      'different1'
    )
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => {
      expect(
        screen.getByText('Las contraseñas no coinciden')
      ).toBeInTheDocument()
    })
  })

  it('shows success alert on valid submission', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Contraseña actual'), 'oldpass123')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'newpass123')
    await user.type(
      screen.getByLabelText('Confirmar nueva contraseña'),
      'newpass123'
    )
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => {
      expect(
        screen.getByText('Contraseña actualizada exitosamente')
      ).toBeInTheDocument()
    })
  })

  it('sets aria-invalid and aria-describedby on invalid fields after submit', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => {
      const input = screen.getByLabelText('Contraseña actual')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute(
        'aria-describedby',
        'currentPassword-error'
      )
      expect(document.getElementById('currentPassword-error')).toHaveAttribute(
        'role',
        'alert'
      )
    })
  })

  it('clears aria-invalid and aria-describedby when field has no error', () => {
    renderPage()
    const input = screen.getByLabelText('Contraseña actual')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('shows error alert when current password is wrong', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Contraseña actual'), 'wrongpassword')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'newpass123')
    await user.type(
      screen.getByLabelText('Confirmar nueva contraseña'),
      'newpass123'
    )
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => {
      expect(
        screen.getByText('La contraseña actual es incorrecta')
      ).toBeInTheDocument()
    })
  })
})
