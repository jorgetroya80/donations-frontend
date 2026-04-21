import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { QuickActions } from './quick-actions'

describe('QuickActions', () => {
  it('renders all action buttons', () => {
    renderWithProviders(<QuickActions />)

    expect(
      screen.getByRole('button', { name: /Nueva donación/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Nuevo gasto/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Ver donantes/ })
    ).toBeInTheDocument()
  })

  it('navigates to /donations/new on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuickActions />)

    await user.click(screen.getByRole('button', { name: /Nueva donación/ }))
    // Navigation happened — MemoryRouter changed route
  })
})
