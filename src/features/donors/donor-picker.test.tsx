import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw-server'
import { renderWithProviders } from '@/test/test-utils'
import { DonorPicker } from './donor-picker'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('DonorPicker', () => {
  it('shows placeholder when no value is selected', () => {
    renderWithProviders(<DonorPicker value={null} onChange={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: 'Seleccione donante' })
    ).toBeInTheDocument()
  })

  it('shows the selected donor name when a value is set', async () => {
    renderWithProviders(<DonorPicker value={1} onChange={vi.fn()} />)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Juan Pérez' })
      ).toBeInTheDocument()
    })
  })

  it('opens the dialog and renders donor rows', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorPicker value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Seleccione donante' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Juan Pérez' })
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: 'María García' })
    ).toBeInTheDocument()
  })

  it('selecting a row calls onChange with the donor id and closes the dialog', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<DonorPicker value={null} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Seleccione donante' }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Juan Pérez' })
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Juan Pérez' }))

    expect(onChange).toHaveBeenCalledWith(1)
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'María García' })
      ).not.toBeInTheDocument()
    })
  })

  it('clear button resets the value to null', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<DonorPicker value={1} onChange={onChange} />)

    const clearButton = await screen.findByRole('button', {
      name: 'Quitar donante',
    })
    await user.click(clearButton)

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('paginates to the next page', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/donors', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? 0)
        const donor =
          page === 0
            ? { id: 1, fullName: 'Juan Pérez', nationalId: '12345678A' }
            : { id: 2, fullName: 'Ana López', nationalId: '99999999Z' }
        return HttpResponse.json({
          content: [{ ...donor, active: true }],
          page: { size: 1, number: page, totalElements: 2, totalPages: 2 },
        })
      })
    )

    renderWithProviders(<DonorPicker value={null} onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Seleccione donante' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Juan Pérez' })
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Ana López' })
      ).toBeInTheDocument()
    })
  })

  it('shows an error message when the donor request fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/donors', () => new HttpResponse(null, { status: 500 }))
    )

    renderWithProviders(<DonorPicker value={null} onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Seleccione donante' }))

    await waitFor(() => {
      expect(
        screen.getByText('Error al cargar los donantes')
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText('No hay donantes registrados')
    ).not.toBeInTheDocument()
  })
})
