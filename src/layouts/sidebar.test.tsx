import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { renderWithProviders } from '@/test/test-utils'
import { Sidebar } from './sidebar'

function setUser(username: string, roles: string[]) {
  localStorage.setItem('auth_user', JSON.stringify({ username, roles }))
}

function renderSidebar() {
  return renderWithProviders(
    <TooltipProvider>
      <Sidebar collapsed={false} onToggle={() => undefined} />
    </TooltipProvider>
  )
}

function getVisibleNavItems() {
  return screen
    .getAllByRole('link')
    .map((link) => link.textContent)
    .filter(Boolean)
}

describe('Sidebar role-based visibility', () => {
  it('ADMIN sees Dashboard and Users only', () => {
    setUser('admin', ['ADMIN'])
    renderSidebar()

    const items = getVisibleNavItems()
    expect(items).toEqual(['Inicio', 'Usuarios'])
  })

  it('TREASURER sees Dashboard, Donations, Donors, Expenses, Reports', () => {
    setUser('tesorero', ['TREASURER'])
    renderSidebar()

    const items = getVisibleNavItems()
    expect(items).toEqual([
      'Inicio',
      'Donaciones',
      'Donantes',
      'Gastos',
      'Reportes',
    ])
  })

  it('PASTOR sees Dashboard and Reports only', () => {
    setUser('pastor', ['PASTOR'])
    renderSidebar()

    const items = getVisibleNavItems()
    expect(items).toEqual(['Inicio', 'Reportes'])
  })

  it('OPERATOR sees Dashboard, Donations, Donors, Expenses', () => {
    setUser('operador', ['OPERATOR'])
    renderSidebar()

    const items = getVisibleNavItems()
    expect(items).toEqual(['Inicio', 'Donaciones', 'Donantes', 'Gastos'])
  })

  it('ADMIN + TREASURER sees all nav items', () => {
    setUser('multi', ['ADMIN', 'TREASURER'])
    renderSidebar()

    const items = getVisibleNavItems()
    expect(items).toEqual([
      'Inicio',
      'Donaciones',
      'Donantes',
      'Gastos',
      'Reportes',
      'Usuarios',
    ])
  })
})

function renderCollapsedSidebar() {
  return renderWithProviders(
    <TooltipProvider>
      <Sidebar collapsed={true} onToggle={() => undefined} />
    </TooltipProvider>
  )
}

describe('Sidebar collapsed state', () => {
  it('renders nav links when collapsed', () => {
    setUser('tesorero', ['TREASURER'])
    const { container } = renderCollapsedSidebar()

    const links = container.querySelectorAll('nav a')
    expect(links).toHaveLength(5)
  })

  it('collapsed nav items are not nested inside a button', () => {
    setUser('admin', ['ADMIN'])
    const { container } = renderCollapsedSidebar()

    const nestedLinks = container.querySelectorAll('button a')
    expect(nestedLinks).toHaveLength(0)
  })
})

describe('Sidebar landmark labels', () => {
  it('aside has aria-label for main navigation', () => {
    setUser('admin', ['ADMIN'])
    renderSidebar()

    const aside = screen.getByRole('complementary')
    expect(aside).toHaveAttribute('aria-label', 'Navegación principal')
  })

  it('nav has aria-label for main navigation', () => {
    setUser('admin', ['ADMIN'])
    renderSidebar()

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(nav).toBeInTheDocument()
  })
})
