import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ReportsPage } from './reports-page'

function renderPage() {
  return renderWithProviders(<ReportsPage />)
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

  it('switches to donor statement tab and shows autocomplete input', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Estado de cuenta del donante'))
    expect(
      screen.getByText('Seleccione un donante para ver su estado de cuenta')
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar donante...')).toBeInTheDocument()
  })

  it('loads donor statement when donor selected from autocomplete', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Estado de cuenta del donante'))

    const input = screen.getByPlaceholderText('Buscar donante...')

    // Type to filter donors
    await user.type(input, 'Juan')

    // Donor option appears
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez — 12345678A')).toBeInTheDocument()
    })

    // Click donor option
    await user.click(screen.getByText('Juan Pérez — 12345678A'))

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

    const input = screen.getByPlaceholderText('Buscar donante...')
    await user.type(input, 'zzznomatch')

    await waitFor(() => {
      expect(
        screen.getByText('No se encontraron donantes')
      ).toBeInTheDocument()
    })
  })

  it('hides statement when input is cleared after donor selected', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Estado de cuenta del donante'))

    const input = screen.getByPlaceholderText('Buscar donante...')
    await user.type(input, 'Juan')

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez — 12345678A')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Juan Pérez — 12345678A'))

    await waitFor(() => {
      expect(screen.getByText('Diezmo')).toBeInTheDocument()
    })

    // Clear the input
    await user.clear(input)

    // Statement should be hidden; prompt message should reappear
    await waitFor(() => {
      expect(screen.queryByText('Diezmo')).not.toBeInTheDocument()
    })
    expect(
      screen.getByText('Seleccione un donante para ver su estado de cuenta')
    ).toBeInTheDocument()
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
