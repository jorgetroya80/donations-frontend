import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { currentMonthRange } from '@/lib/formatters'
import { server } from '@/test/msw-server'
import { renderWithProviders } from '@/test/test-utils'
import { FinancialOverview } from './financial-overview'
import { previousRange } from './financial-overview.utils'

// The ranking cards repeat the same figures, so the stat-card assertions are
// scoped to the stat row.
function statCards(container: HTMLElement) {
  return within(container.querySelector('[aria-busy]') as HTMLElement)
}

describe('FinancialOverview', () => {
  it('renders section heading', () => {
    renderWithProviders(<FinancialOverview />)
    expect(screen.getByText('Resumen financiero')).toBeInTheDocument()
  })

  it('renders balance cards with data from API', async () => {
    const { container } = renderWithProviders(<FinancialOverview />)
    const stats = statCards(container)

    await waitFor(() => {
      expect(stats.getByText(/5[.\s]?000/)).toBeInTheDocument()
    })

    expect(stats.getByText(/3[.\s]?000/)).toBeInTheDocument()
    expect(stats.getByText(/2[.\s]?000/)).toBeInTheDocument()
  })

  it('renders the stat cards while loading rather than a skeleton above them', async () => {
    const { container } = renderWithProviders(<FinancialOverview />)

    // The cards are in the tree from the first paint, showing placeholders.
    expect(screen.getByText('Ingresos totales')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(3)

    // So no extra loading block sits above them: one that unmounts on load
    // would pull the whole dashboard upwards and shift the layout.
    expect(screen.queryByLabelText('Cargando...')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(statCards(container).getByText(/5[.\s]?000/)).toBeInTheDocument()
    })
  })

  it('renders card titles', () => {
    renderWithProviders(<FinancialOverview />)

    expect(screen.getByText('Ingresos totales')).toBeInTheDocument()
    expect(screen.getByText('Gastos totales')).toBeInTheDocument()
    expect(screen.getByText('Balance neto')).toBeInTheDocument()
  })

  it('ranks every category with its amount, no hover needed', async () => {
    renderWithProviders(<FinancialOverview />)

    const table = await screen.findByRole('table', {
      name: /Gastos por categoría/,
    })
    await waitFor(() => {
      expect(within(table).getAllByRole('row')).toHaveLength(2)
    })
    expect(within(table).getByText('Alquiler')).toBeInTheDocument()
    expect(within(table).getByText('Servicios')).toBeInTheDocument()
  })

  it('keeps a category that only has data in the previous period', async () => {
    const range = currentMonthRange()
    const previous = previousRange(range.from, range.to)

    server.use(
      http.get('*/api/v1/reports/expenses', ({ request }) => {
        const from = new URL(request.url).searchParams.get('from')
        const isPrevious = from === previous.from
        return HttpResponse.json({
          from,
          to: new URL(request.url).searchParams.get('to'),
          totalsByCategory: isPrevious
            ? [
                { category: 'RENT', total: 1500 },
                { category: 'MAINTENANCE', total: 400 },
              ]
            : [{ category: 'RENT', total: 1500 }],
          grandTotal: isPrevious ? 1900 : 1500,
        })
      })
    )

    renderWithProviders(<FinancialOverview />)

    // Mantenimiento dropped to zero this period: it must still show, as -100%.
    const row = await screen.findByText('Mantenimiento')
    expect(row.closest('tr')).toHaveTextContent(/↓ 100\.0%/)
  })

  it('shows each period total from the report grand totals', async () => {
    renderWithProviders(<FinancialOverview />)

    await waitFor(() => {
      expect(screen.getByText(/total .*5[.\s]?000/)).toBeInTheDocument()
    })
    expect(screen.getByText(/total .*3[.\s]?000/)).toBeInTheDocument()
  })
})
