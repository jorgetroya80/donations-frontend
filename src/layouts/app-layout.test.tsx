import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { AppLayout } from './app-layout'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('AppLayout mobile navigation', () => {
  it('opens the drawer from the menu button and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppLayout />)

    // Only the desktop sidebar is rendered initially
    expect(screen.getAllByRole('complementary')).toHaveLength(1)

    const menuButton = screen.getByRole('button', { name: 'Abrir menú' })
    await user.click(menuButton)

    // Drawer adds a second sidebar
    expect(screen.getAllByRole('complementary')).toHaveLength(2)

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.getAllByRole('complementary')).toHaveLength(1)
    })
    expect(menuButton).toHaveFocus()
  })

  it('closes the drawer when a nav link is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppLayout />)

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.getAllByRole('complementary')).toHaveLength(2)

    const drawer = screen.getAllByRole('complementary')[1]!
    const links = drawer.querySelectorAll('a')
    expect(links.length).toBeGreaterThan(0)
    await user.click(links[0]!)

    await waitFor(() => {
      expect(screen.getAllByRole('complementary')).toHaveLength(1)
    })
  })
})
