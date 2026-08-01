import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from './stat-card'

function renderCard(props: Partial<Parameters<typeof StatCard>[0]> = {}) {
  return render(
    <StatCard
      label="Ingresos totales"
      icon={<span />}
      value={5000}
      current={5000}
      previous={4000}
      {...props}
    />
  )
}

describe('StatCard', () => {
  it('renders the percentage change when previous period data is present', () => {
    renderCard()
    expect(screen.getByText(/25\.0%/)).toBeInTheDocument()
  })

  it('reserves the change line while previous period data is missing', () => {
    const { container } = renderCard({ previous: undefined })

    // No figure to show yet...
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()

    // ...but the line still occupies its space, so the card does not grow
    // when the slower previous-period query resolves.
    const placeholder = container.querySelector('[data-slot="pct-change"]')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toHaveClass('invisible')
  })

  it('renders a placeholder instead of a value while loading', () => {
    renderCard({ value: undefined })
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
