import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/test/msw-server'
import { renderWithProviders } from '@/test/test-utils'
import { DonationCreatePage } from './donation-create-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

async function fillAndSubmitForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Monto'), '100')
  await user.type(screen.getByLabelText('Fecha'), '2026-04-15')

  // base-ui Select doesn't work well with userEvent in jsdom
  // Use fireEvent for select interactions
  const triggers = screen.getAllByRole('combobox')

  // Select donation type
  fireEvent.click(triggers[0])
  await waitFor(() => {
    expect(screen.getByText('Diezmo')).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText('Diezmo'))

  // Select payment method
  fireEvent.click(triggers[1])
  await waitFor(() => {
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText('Efectivo'))

  await user.click(screen.getByRole('button', { name: 'Guardar' }))
}

const mockDonation = {
  id: 3,
  amount: 100,
  donationDate: '2026-04-15',
  donationType: 'TITHE',
  paymentMethod: 'CASH',
  donorId: null,
  donorName: null,
  notes: null,
  createdAt: '2026-04-15T10:00:00',
  updatedAt: '2026-04-15T10:00:00',
}

describe('DonationCreatePage', () => {
  it('renders create page title and form', () => {
    renderWithProviders(<DonationCreatePage />)
    expect(screen.getByText('Nueva donación')).toBeInTheDocument()
    expect(screen.getByLabelText('Monto')).toBeInTheDocument()
  })

  it('renders Cancel button', () => {
    renderWithProviders(<DonationCreatePage />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('shows duplicate warning and allows confirm', async () => {
    server.use(
      http.post('*/api/v1/donations', async ({ request }) => {
        const body = (await request.json()) as { confirmDuplicate?: boolean }
        if (body.confirmDuplicate) {
          return HttpResponse.json({
            donation: mockDonation,
            duplicateWarning: false,
            saved: true,
          })
        }
        return HttpResponse.json({
          donation: mockDonation,
          duplicateWarning: true,
          saved: false,
        })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<DonationCreatePage />)

    await fillAndSubmitForm(user)

    await waitFor(() => {
      expect(screen.getByText(/posible duplicado/i)).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /Confirmar y guardar/ })
    )

    await waitFor(() => {
      expect(screen.queryByText(/posible duplicado/i)).not.toBeInTheDocument()
    })
  })
})
