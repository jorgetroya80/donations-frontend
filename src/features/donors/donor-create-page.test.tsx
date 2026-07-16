import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/test/msw-server'
import { problemDetailResponse } from '@/test/problem-detail'
import { renderWithProviders } from '@/test/test-utils'
import { DonorCreatePage } from './donor-create-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('DonorCreatePage', () => {
  it('renders create page title and form', () => {
    renderWithProviders(<DonorCreatePage />)
    expect(screen.getByText('Nuevo donante')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
  })

  it('renders Cancel button', () => {
    renderWithProviders(<DonorCreatePage />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('renders server field errors from a problem+json 400 through the SDK', async () => {
    server.use(
      http.post('*/api/v1/donors', () =>
        problemDetailResponse({
          status: 400,
          title: 'Bad Request',
          detail: 'Validation failed',
          instance: '/api/v1/donors',
          fields: { nationalId: 'Formato de DNI/NIE inválido' },
        })
      )
    )
    const user = userEvent.setup()
    renderWithProviders(<DonorCreatePage />)

    await user.type(screen.getByLabelText('Nombre completo'), 'Juan Pérez')
    await user.type(screen.getByLabelText('DNI/NIE'), '12345678A')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Formato de DNI/NIE inválido')
      ).toBeInTheDocument()
    })
  })
})
