import { fireEvent, screen, waitFor } from '@testing-library/react'
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

  it('switches to donor statement tab and shows donor selector', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Estado de cuenta del donante'))
    expect(
      screen.getByText('Seleccione un donante para ver su estado de cuenta')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Seleccione un donante')).toBeInTheDocument()
  })

  it('loads donor statement when donor selected', async () => {
    renderPage()
    // Switch to donor statement tab
    fireEvent.click(screen.getByText('Estado de cuenta del donante'))

    // Wait for donors to load in selector
    const select = screen.getByLabelText(
      'Seleccione un donante'
    ) as HTMLSelectElement
    await waitFor(() => {
      expect(select.options.length).toBeGreaterThan(1)
    })

    // Select donor
    fireEvent.change(select, { target: { value: '1' } })

    // Wait for statement table to render (proves data loaded)
    await waitFor(() => {
      expect(screen.getByText('Diezmo')).toBeInTheDocument()
    })
    expect(screen.getByText('Ofrenda')).toBeInTheDocument()
    expect(screen.getByText('Total general')).toBeInTheDocument()
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
})
