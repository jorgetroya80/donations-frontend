import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { FinancialOverview } from './financial-overview'

describe('FinancialOverview', () => {
  it('renders section heading', () => {
    renderWithProviders(<FinancialOverview />)
    expect(screen.getByText('Resumen financiero')).toBeInTheDocument()
  })

  it('renders balance cards with data from API', async () => {
    renderWithProviders(<FinancialOverview />)

    await waitFor(() => {
      expect(screen.getByText(/5[.\s]?000/)).toBeInTheDocument()
    })

    expect(screen.getByText(/3[.\s]?000/)).toBeInTheDocument()
    expect(screen.getByText(/2[.\s]?000/)).toBeInTheDocument()
  })

  it('renders card titles', () => {
    renderWithProviders(<FinancialOverview />)

    expect(screen.getByText('Ingresos totales')).toBeInTheDocument()
    expect(screen.getByText('Gastos totales')).toBeInTheDocument()
    expect(screen.getByText('Balance neto')).toBeInTheDocument()
  })
})
