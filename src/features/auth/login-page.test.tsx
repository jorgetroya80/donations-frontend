import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, HttpResponse, http } from 'msw'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/test/msw-server'
import { problemDetailResponse } from '@/test/problem-detail'
import { renderWithProviders } from '@/test/test-utils'
import { LoginPage } from './login-page'

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Dashboard</p>} />
      <Route
        path="/settings/password"
        element={<p>Change Password Screen</p>}
      />
    </Routes>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('LoginPage', () => {
  it('renders login form', () => {
    renderWithProviders(<TestApp />, { route: '/login' })
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('renders the title as the page heading', () => {
    renderWithProviders(<TestApp />, { route: '/login' })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })
    ).toBeInTheDocument()
  })

  it('leaves the fields unassociated while there is no error', () => {
    renderWithProviders(<TestApp />, { route: '/login' })

    for (const label of ['Usuario', 'Contraseña']) {
      const field = screen.getByLabelText(label)
      expect(field).toHaveAttribute('aria-invalid', 'false')
      expect(field).not.toHaveAttribute('aria-describedby')
    }
  })

  it('points both fields at the error once login fails', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'wrong')
    await user.type(screen.getByLabelText('Contraseña'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveAttribute('id', 'login-error')
    })
    for (const label of ['Usuario', 'Contraseña']) {
      const field = screen.getByLabelText(label)
      expect(field).toHaveAttribute('aria-invalid', 'true')
      expect(field).toHaveAttribute('aria-describedby', 'login-error')
    }
  })

  it('marks the submit button busy while it waits on the API', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/api/v1/login', async () => {
        await delay('infinite')
        return HttpResponse.json({})
      })
    )
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'random')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Ingresando...' })
      ).toHaveAttribute('aria-busy', 'true')
    })
  })

  it('redirects to dashboard on successful login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'random')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'wrong')
    await user.type(screen.getByLabelText('Contraseña'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Usuario o contraseña incorrectos')
      ).toBeInTheDocument()
    })
  })

  it('stores user in localStorage after login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'random')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('auth_user')!)
      expect(stored).toEqual({
        username: 'admin',
        roles: ['ADMIN'],
        mustChangePassword: false,
      })
    })
  })

  it('redirects to change-password when mustChangePassword=true', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'must-rotate')
    await user.type(screen.getByLabelText('Contraseña'), 'random')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByText('Change Password Screen')).toBeInTheDocument()
    })
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('shows invalid-credentials error on 400 for blank credentials', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), ' ')
    await user.type(screen.getByLabelText('Contraseña'), ' ')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Usuario o contraseña incorrectos')
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText('Error de conexión. Intente nuevamente.')
    ).not.toBeInTheDocument()
  })

  it('does not count 400 blank-credential rejections toward lockout', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    const username = screen.getByLabelText('Usuario')
    const password = screen.getByLabelText('Contraseña')
    const submit = screen.getByRole('button', { name: 'Ingresar' })

    for (let i = 0; i < 4; i++) {
      await user.clear(username)
      await user.clear(password)
      await user.type(username, 'wrong')
      await user.type(password, 'wrong')
      await user.click(submit)
      await waitFor(() => expect(submit).not.toBeDisabled())
    }

    // A validation 400 as the 5th rejection must not trip the lockout hint
    await user.clear(username)
    await user.clear(password)
    await user.type(username, ' ')
    await user.type(password, ' ')
    await user.click(submit)
    await waitFor(() => expect(submit).not.toBeDisabled())

    expect(
      screen.getByText('Usuario o contraseña incorrectos')
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Demasiados intentos fallidos. La cuenta puede estar bloqueada por unos 15 minutos.'
      )
    ).not.toBeInTheDocument()

    // ...and the counter must survive the 400: the next 401 is the 5th
    // real failure and trips the lockout hint
    await user.clear(username)
    await user.clear(password)
    await user.type(username, 'wrong')
    await user.type(password, 'wrong')
    await user.click(submit)

    await waitFor(() => {
      expect(
        screen.getByText(
          'Demasiados intentos fallidos. La cuenta puede estar bloqueada por unos 15 minutos.'
        )
      ).toBeInTheDocument()
    })
  })

  it('shows connection error, not invalid credentials, on a 500', async () => {
    server.use(
      http.post('*/api/v1/login', () =>
        problemDetailResponse({
          status: 500,
          title: 'Internal Server Error',
          detail: 'Unexpected error',
          instance: '/api/v1/login',
        })
      )
    )
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    await user.type(screen.getByLabelText('Usuario'), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'random')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Error de conexión. Intente nuevamente.')
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText('Usuario o contraseña incorrectos')
    ).not.toBeInTheDocument()
  })

  it('shows lockout hint after 5 consecutive failed attempts', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestApp />, { route: '/login' })

    const username = screen.getByLabelText('Usuario')
    const password = screen.getByLabelText('Contraseña')
    const submit = screen.getByRole('button', { name: 'Ingresar' })

    for (let i = 0; i < 5; i++) {
      await user.clear(username)
      await user.clear(password)
      await user.type(username, 'wrong')
      await user.type(password, 'wrong')
      await user.click(submit)
      await waitFor(() => expect(submit).not.toBeDisabled())
    }

    expect(
      screen.getByText(
        'Demasiados intentos fallidos. La cuenta puede estar bloqueada por unos 15 minutos.'
      )
    ).toBeInTheDocument()
  })
})
