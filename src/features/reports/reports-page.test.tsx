import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ReportsPage } from './reports-page'

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

function renderPage(route = '/reports') {
  return renderWithProviders(
    <>
      <ReportsPage />
      <LocationProbe />
    </>,
    { route }
  )
}

describe('ReportsPage', () => {
  it('renders page title and tabs', () => {
    renderPage()
    expect(screen.getByText('Reportes')).toBeInTheDocument()
    expect(screen.getByText('Resumen de donaciones')).toBeInTheDocument()
    expect(screen.getByText('Resumen de gastos')).toBeInTheDocument()
    expect(screen.getByText('Estado de cuenta del donante')).toBeInTheDocument()
  })

  it('shows donation summary tab by default with data', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Diezmo')).toBeInTheDocument()
    })
    expect(screen.getByText('Ofrenda')).toBeInTheDocument()
    expect(screen.getByText('Total general')).toBeInTheDocument()
  })

  it('switches to expense summary tab', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Resumen de gastos'))
    await waitFor(() => {
      expect(screen.getByText('Alquiler')).toBeInTheDocument()
    })
    expect(screen.getByText('Servicios')).toBeInTheDocument()
  })

  it('switches to donor statement tab and shows donor picker input', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Estado de cuenta del donante'))
    expect(
      screen.getByText('Seleccione un donante para ver su estado de cuenta')
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar donante…')).toBeInTheDocument()
  })

  it('loads donor statement when donor selected from picker', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Estado de cuenta del donante'))

    const input = screen.getByPlaceholderText('Buscar donante…')

    // Type to filter donors (server-side search)
    await user.click(input)
    await user.type(input, 'Juan')

    // Donor option appears
    const option = await screen.findByRole('option', { name: /Juan Pérez/ })

    // Click donor option
    await user.click(option)

    // Statement loads
    await waitFor(() => {
      expect(screen.getByText('Diezmo')).toBeInTheDocument()
    })
    expect(screen.getByText('Ofrenda')).toBeInTheDocument()
    expect(screen.getByText('Total general')).toBeInTheDocument()
  })

  it('shows no donors found message when search matches nothing', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Estado de cuenta del donante'))

    const input = screen.getByPlaceholderText('Buscar donante…')
    await user.click(input)
    await user.type(input, 'zzznomatch')

    await waitFor(() => {
      expect(screen.getByText('No se encontraron donantes')).toBeInTheDocument()
    })
  })

  it('hides statement when donor is cleared after selection', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Estado de cuenta del donante'))

    const input = screen.getByPlaceholderText('Buscar donante…')
    await user.click(input)
    await user.type(input, 'Juan')

    const option = await screen.findByRole('option', { name: /Juan Pérez/ })
    await user.click(option)

    await waitFor(() => {
      expect(screen.getByText('Diezmo')).toBeInTheDocument()
    })

    // Clear the selected donor via the clear button
    await user.click(screen.getByRole('button', { name: 'Quitar donante' }))

    // Statement should be hidden; prompt message should reappear
    await waitFor(() => {
      expect(screen.queryByText('Diezmo')).not.toBeInTheDocument()
    })
    expect(
      screen.getByText('Seleccione un donante para ver su estado de cuenta')
    ).toBeInTheDocument()
  })

  it('writes the tab to the URL and keeps the default tab clean', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/reports$/)

    await user.click(screen.getByText('Resumen de gastos'))
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/reports?tab=expenses'
    )

    await user.click(screen.getByText('Resumen de donaciones'))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/reports$/)
  })

  it('initializes the active tab from the URL', () => {
    renderPage('/reports?tab=donor-statement')
    expect(
      screen.getByRole('tab', { name: 'Estado de cuenta del donante' })
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByPlaceholderText('Buscar donante…')).toBeInTheDocument()
  })

  it('falls back to the donations tab for an invalid tab param', () => {
    renderPage('/reports?tab=bogus')
    expect(
      screen.getByRole('tab', { name: 'Resumen de donaciones' })
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('writes the selected donor to the URL', async () => {
    const user = userEvent.setup()
    renderPage('/reports?tab=donor-statement')

    const input = screen.getByPlaceholderText('Buscar donante…')
    await user.click(input)
    await user.type(input, 'Juan')
    await user.click(await screen.findByRole('option', { name: /Juan Pérez/ }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/reports?tab=donor-statement&donorId=1'
      )
    })
  })

  it('loads the donor statement from a deep link', async () => {
    renderPage('/reports?tab=donor-statement&donorId=1')

    await waitFor(() => {
      expect(screen.getByText('Diezmo')).toBeInTheDocument()
    })
    expect(screen.getByText('Total general')).toBeInTheDocument()
  })

  it('pushes history on tab switch so Back returns to the previous tab', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('Resumen de gastos'))
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/reports?tab=expenses'
    )

    await user.click(screen.getByRole('button', { name: 'history-back' }))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/reports$/)
    expect(
      screen.getByRole('tab', { name: 'Resumen de donaciones' })
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('does not push a history entry when the active tab is re-clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('Resumen de gastos'))
    await user.click(screen.getByText('Resumen de gastos'))

    // One Back must return to the donations tab; a duplicate push for the
    // re-click would leave us stuck on ?tab=expenses.
    await user.click(screen.getByRole('button', { name: 'history-back' }))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/reports$/)
    expect(
      screen.getByRole('tab', { name: 'Resumen de donaciones' })
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('replaces history on donor selection so Back does not restore it', async () => {
    const user = userEvent.setup()
    renderPage()

    // Push entry: donations tab -> donor-statement tab
    await user.click(screen.getByText('Estado de cuenta del donante'))

    const input = screen.getByPlaceholderText('Buscar donante…')
    await user.click(input)
    await user.type(input, 'Juan')
    await user.click(await screen.findByRole('option', { name: /Juan Pérez/ }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/reports?tab=donor-statement&donorId=1'
      )
    })

    // Back skips the donorId tweak entirely and lands on the previous tab.
    await user.click(screen.getByRole('button', { name: 'history-back' }))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/reports$/)
  })

  it('removes the donor param when the donor is cleared', async () => {
    const user = userEvent.setup()
    renderPage('/reports?tab=donor-statement&donorId=1')

    await waitFor(() => {
      expect(screen.getByText('Diezmo')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Quitar donante' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        /^\/reports\?tab=donor-statement$/
      )
    })
    expect(
      screen.getByText('Seleccione un donante para ver su estado de cuenta')
    ).toBeInTheDocument()
  })

  it('clears the donor param when switching tabs', async () => {
    const user = userEvent.setup()
    renderPage('/reports?tab=donor-statement&donorId=1')

    await user.click(screen.getByText('Resumen de gastos'))
    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/reports\?tab=expenses$/
    )
  })

  it('shows active tab styling', () => {
    renderPage()
    const donationsTab = screen.getByRole('tab', {
      name: 'Resumen de donaciones',
    })
    expect(donationsTab.getAttribute('aria-selected')).toBe('true')

    const expensesTab = screen.getByRole('tab', {
      name: 'Resumen de gastos',
    })
    expect(expensesTab.getAttribute('aria-selected')).toBe('false')
  })

  it('tab buttons have id and aria-controls pointing to panel', () => {
    renderPage()
    const donationsTab = screen.getByRole('tab', {
      name: 'Resumen de donaciones',
    })
    expect(donationsTab).toHaveAttribute('id', 'tab-donations')
    expect(donationsTab).toHaveAttribute('aria-controls', 'panel-donations')

    const expensesTab = screen.getByRole('tab', { name: 'Resumen de gastos' })
    expect(expensesTab).toHaveAttribute('id', 'tab-expenses')
    expect(expensesTab).toHaveAttribute('aria-controls', 'panel-expenses')
  })

  it('active panel has tabpanel role wired to its tab', () => {
    renderPage()
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('id', 'panel-donations')
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-donations')
    expect(panel).toHaveAttribute('tabindex', '0')
  })

  it('switching tabs updates panel id and aria-labelledby', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Resumen de gastos'))

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('id', 'panel-expenses')
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-expenses')
  })
})
