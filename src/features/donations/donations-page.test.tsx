import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { useLocation, useNavigate } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/test/msw-server'
import { problemDetailResponse } from '@/test/problem-detail'
import { renderWithProviders } from '@/test/test-utils'
import { DonationsPage } from './donations-page'

function LocationProbe() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <div data-testid="location">{pathname + search}</div>
      <button type="button" onClick={() => navigate(-1)}>
        history-back
      </button>
    </>
  )
}

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('DonationsPage', () => {
  it('renders page title and new donation button', () => {
    renderWithProviders(<DonationsPage />)
    expect(screen.getByText('Donaciones')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Nueva donación/ })
    ).toBeInTheDocument()
  })

  it('renders donation rows from API', async () => {
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    expect(screen.getByText('Anónimo')).toBeInTheDocument()
    expect(screen.getByText('Diezmo')).toBeInTheDocument()
    expect(screen.getByText('Ofrenda')).toBeInTheDocument()
  })

  it('shows the ProblemDetail message when loading fails', async () => {
    server.use(
      http.get('*/api/v1/donations', () =>
        problemDetailResponse({
          status: 500,
          title: 'Error interno',
          detail: 'La base de datos no está disponible',
          instance: '/api/v1/donations',
        })
      )
    )

    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(
        screen.getByText('La base de datos no está disponible')
      ).toBeInTheDocument()
    })
  })

  it('renders pagination info', async () => {
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })
  })

  it('sort button changes sort indicator', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const dateHeader = screen.getByText(/Fecha/)
    await user.click(dateHeader)
    await waitFor(() => {
      expect(screen.getByText(/Fecha/).textContent).toContain('↑')
    })
  })

  it('sort by amount column', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const amountHeader = screen.getByText(/Monto/)
    await user.click(amountHeader)
    await waitFor(() => {
      expect(screen.getByText(/Monto/).textContent).toContain('↑')
    })
  })

  it('pagination buttons are rendered and disabled on single page', async () => {
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
  })

  it('shows edit links for each row', async () => {
    renderWithProviders(<DonationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const editLinks = screen.getAllByRole('link')
    expect(editLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('toggles sort with Enter key on sortable header', async () => {
    renderWithProviders(<DonationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    const sortButton = within(
      screen.getByRole('columnheader', { name: /Fecha/ })
    ).getByRole('button')
    sortButton.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Fecha/ })
      ).toHaveAttribute('aria-sort', 'ascending')
    })
  })

  it('toggles sort with Space key on sortable header', async () => {
    renderWithProviders(<DonationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    const sortButton = within(
      screen.getByRole('columnheader', { name: /Fecha/ })
    ).getByRole('button')
    sortButton.focus()
    await user.keyboard(' ')
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Fecha/ })
      ).toHaveAttribute('aria-sort', 'ascending')
    })
  })

  it('writes sort to the URL and clears the page param', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <DonationsPage />
        <LocationProbe />
      </>,
      { route: '/donations?page=3' }
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Fecha/))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/donations?sort=donationDate%2Casc'
      )
    })
  })

  it('replaces history on sort change so Back does not undo it', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <DonationsPage />
        <LocationProbe />
      </>,
      { route: '/donations' }
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Fecha/))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/donations?sort=donationDate%2Casc'
      )
    })

    // Sort used replace: the history stack has a single entry, so going
    // back is a no-op instead of restoring the pre-sort URL.
    await user.click(screen.getByRole('button', { name: 'history-back' }))
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/donations?sort=donationDate%2Casc'
    )
  })

  it('initializes sort from the URL', async () => {
    renderWithProviders(<DonationsPage />, {
      route: '/donations?sort=amount,asc',
    })

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    expect(screen.getByRole('columnheader', { name: /Monto/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
  })

  it('requests the page from the URL (1-based param, 0-based API)', async () => {
    let requestedPage: string | null = null
    server.use(
      http.get('*/api/v1/donations', ({ request }) => {
        requestedPage = new URL(request.url).searchParams.get('page')
        return HttpResponse.json({
          content: [],
          page: { number: 2, totalPages: 3, size: 10, totalElements: 25 },
        })
      })
    )

    renderWithProviders(<DonationsPage />, { route: '/donations?page=3' })

    await waitFor(() => {
      expect(requestedPage).toBe('2')
    })
  })

  it('edit links have descriptive aria-labels', async () => {
    renderWithProviders(<DonationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const editLinks = screen.getAllByRole('link', { name: /Editar donación/ })
    expect(editLinks[0]).toBeInTheDocument()
  })
})
