import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryRanking, type RankingItem } from './category-ranking'

const items: RankingItem[] = [
  { key: 'RENT', label: 'Alquiler', current: 1500, previous: 1000 },
  { key: 'IRPF', label: 'IRPF', current: 21450, previous: 21450 },
  { key: 'MAINTENANCE', label: 'Mantenimiento', current: 310, previous: 400 },
]

function rowLabels() {
  return screen
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent)
}

function bars(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[aria-hidden="true"] > div')
  )
}

describe('CategoryRanking', () => {
  it('sorts rows descending by current amount regardless of input order', () => {
    render(<CategoryRanking items={items} title="Gastos por categoría" />)
    expect(rowLabels()).toEqual(['IRPF', 'Alquiler', 'Mantenimiento'])
  })

  it('breaks ties by label so the order is stable across renders', () => {
    render(
      <CategoryRanking
        title="Gastos por categoría"
        items={[
          { key: 'B', label: 'Bravo', current: 100, previous: 100 },
          { key: 'A', label: 'Alfa', current: 100, previous: 100 },
        ]}
      />
    )
    expect(rowLabels()).toEqual(['Alfa', 'Bravo'])
  })

  it('gives the largest row a full-width bar and scales the rest', () => {
    const { container } = render(
      <CategoryRanking items={items} title="Gastos por categoría" />
    )

    const [largest, second] = bars(container)
    expect(largest?.style.width).toBe('100%')
    expect(second?.style.width).not.toBe('100%')
    expect(Number.parseFloat(second?.style.width ?? '0')).toBeCloseTo(
      (1500 / 21450) * 100
    )
  })

  it('labels a category with no previous amount as new instead of a percentage', () => {
    render(
      <CategoryRanking
        title="Gastos por categoría"
        items={[{ key: 'RENT', label: 'Alquiler', current: 500, previous: 0 }]}
      />
    )

    expect(screen.getByText('nuevo')).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('renders a category that dropped to zero as a 100% decrease', () => {
    render(
      <CategoryRanking
        title="Gastos por categoría"
        items={[{ key: 'RENT', label: 'Alquiler', current: 0, previous: 500 }]}
      />
    )

    expect(screen.getByText(/↓ 100\.0%/)).toBeInTheDocument()
    expect(screen.queryByText('nuevo')).not.toBeInTheDocument()
  })

  it('renders the exact amount as text for every row', () => {
    render(<CategoryRanking items={items} title="Gastos por categoría" />)

    expect(screen.getByText(/21[.\s]?450/)).toBeInTheDocument()
    expect(screen.getByText(/1[.\s]?500/)).toBeInTheDocument()
    expect(screen.getByText(/310/)).toBeInTheDocument()
  })

  it('colours an increase as bad when inverted and as good when not', () => {
    const growing: RankingItem[] = [
      { key: 'RENT', label: 'Alquiler', current: 200, previous: 100 },
    ]

    const expenses = render(
      <CategoryRanking items={growing} title="Gastos" inverted />
    )
    expect(expenses.getByText(/↑ 100\.0%/)).toHaveClass('text-destructive')
    expenses.unmount()

    const donations = render(
      <CategoryRanking items={growing} title="Donaciones" />
    )
    expect(donations.getByText(/↑ 100\.0%/)).toHaveClass('text-success')
  })

  it('renders nothing when there are no items', () => {
    const { container } = render(
      <CategoryRanking items={[]} title="Gastos por categoría" />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('names the table for screen readers', () => {
    render(<CategoryRanking items={items} title="Gastos por categoría" />)
    expect(
      screen.getByRole('table', {
        name: /Gastos por categoría, importe y variación/,
      })
    ).toBeInTheDocument()
  })
})
