import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ComparisonBarChart } from './comparison-bar-chart.lazy'

const config = {
  current: { label: 'Actual', color: 'var(--chart-1)' },
  previous: { label: 'Anterior', color: 'var(--chart-3)' },
}
const data = [{ type: 'TITHE', current: 100, previous: 50 }]

describe('ComparisonBarChart (lazy)', () => {
  // The chart is code-split, so the first paint is the fallback. It must
  // occupy the same box the chart will — aspect-video plus the caller's
  // max-h-* — or swapping the chart in shifts the layout.
  it('renders a placeholder matching the chart box before the chunk loads', () => {
    const { container } = renderWithProviders(
      <ComparisonBarChart
        data={data}
        config={config}
        categoryKey="type"
        categoryWidth={120}
        className="max-h-20"
      />
    )

    const placeholder = container.querySelector('.animate-pulse')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toHaveClass('aspect-video', 'max-h-20')
  })

  it('renders the chart once the chunk resolves', async () => {
    const { container } = renderWithProviders(
      <ComparisonBarChart
        data={data}
        config={config}
        categoryKey="type"
        categoryWidth={120}
        className="max-h-45"
      />
    )

    await waitFor(() => {
      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
  })

  it('passes className through to the resolved chart', async () => {
    const { container } = renderWithProviders(
      <ComparisonBarChart
        data={data}
        config={config}
        categoryKey="type"
        categoryWidth={120}
        className="max-h-75"
      />
    )

    await waitFor(() => {
      expect(container.querySelector('[data-slot="chart"]')).toHaveClass(
        'max-h-75'
      )
    })
  })
})
