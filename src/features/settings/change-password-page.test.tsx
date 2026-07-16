import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { kyInstance } from '@/lib/api'
import { server } from '@/test/msw-server'
import { problemDetailResponse } from '@/test/problem-detail'
import { renderWithProviders } from '@/test/test-utils'
import { ChangePasswordPage } from './change-password-page'

function renderPage() {
  return renderWithProviders(<ChangePasswordPage />)
}

function renderForcedFlow(authUser: {
  username: string
  roles: string[]
  mustChangePassword: boolean
}) {
  localStorage.setItem('auth_user', JSON.stringify(authUser))
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<p>Dashboard</p>} />
      <Route path="/settings/password" element={<ChangePasswordPage />} />
    </Routes>,
    { route: '/settings/password' }
  )
}

beforeEach(() => {
  localStorage.clear()
})

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
      expect(input).toHaveAttribute('aria-describedby', 'currentPassword-error')
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

  it('shows forced-rotation notice when user.mustChangePassword=true', () => {
    renderForcedFlow({
      username: 'admin',
      roles: ['ADMIN'],
      mustChangePassword: true,
    })

    expect(
      screen.getByText(
        'Por seguridad, debe cambiar su contraseña antes de continuar.'
      )
    ).toBeInTheDocument()
  })

  it('does not show notice on voluntary change', () => {
    renderForcedFlow({
      username: 'admin',
      roles: ['ADMIN'],
      mustChangePassword: false,
    })

    expect(
      screen.queryByText(
        'Por seguridad, debe cambiar su contraseña antes de continuar.'
      )
    ).not.toBeInTheDocument()
  })

  it('clears the flag and redirects to / on success in forced mode', async () => {
    const user = userEvent.setup()
    renderForcedFlow({
      username: 'admin',
      roles: ['ADMIN'],
      mustChangePassword: true,
    })

    await user.type(screen.getByLabelText('Contraseña actual'), 'oldpass123')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'newpass123')
    await user.type(
      screen.getByLabelText('Confirmar nueva contraseña'),
      'newpass123'
    )
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
    const stored = JSON.parse(localStorage.getItem('auth_user')!)
    expect(stored.mustChangePassword).toBe(false)
  })

  it('reveals the forced-rotation banner after a 403 PASSWORD_CHANGE_REQUIRED', async () => {
    const originalPath = window.location.pathname
    window.history.pushState({}, '', '/settings/password')
    server.use(
      http.get('*/api/v1/ping', () =>
        problemDetailResponse({
          status: 403,
          title: 'Forbidden',
          detail: 'Password change required',
          instance: '/api/v1/ping',
          code: 'PASSWORD_CHANGE_REQUIRED',
        })
      )
    )
    renderForcedFlow({
      username: 'admin',
      roles: ['ADMIN'],
      mustChangePassword: false,
    })

    expect(
      screen.queryByText(
        'Por seguridad, debe cambiar su contraseña antes de continuar.'
      )
    ).not.toBeInTheDocument()

    await act(async () => {
      await kyInstance.get('http://localhost/api/v1/ping')
    })

    await waitFor(() => {
      expect(
        screen.getByText(
          'Por seguridad, debe cambiar su contraseña antes de continuar.'
        )
      ).toBeInTheDocument()
    })
    window.history.pushState({}, '', originalPath)
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
