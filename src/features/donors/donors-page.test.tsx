import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonorsPage } from './donors-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'treasurer', roles: ['TREASURER'] })
  )
})

describe('DonorsPage', () => {
  it('renders page title and new donor button', () => {
    renderWithProviders(<DonorsPage />)
    expect(screen.getByText('Donantes')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Nuevo donante/ })
    ).toBeInTheDocument()
  })

  it('renders donor rows from API', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.getByText('12345678A')).toBeInTheDocument()
    expect(screen.getByText('87654321B')).toBeInTheDocument()
  })

  it('shows active/inactive badges', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('renders pagination info', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })
  })

  it('sort button changes sort indicator', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    // Default sort is fullName,asc — header shows ↑
    expect(screen.getByText(/Nombre completo/).textContent).toContain('↑')

    // Click to toggle to desc
    await user.click(screen.getByText(/Nombre completo/))
    await waitFor(() => {
      expect(screen.getByText(/Nombre completo/).textContent).toContain('↓')
    })
  })

  it('pagination buttons are disabled on single page', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
  })

  it('shows edit links for each row', async () => {
    renderWithProviders(<DonorsPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const editLinks = screen.getAllByRole('link')
    expect(editLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('toggles sort with Enter key on sortable header', async () => {
    renderWithProviders(<DonorsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    const sortButton = within(
      screen.getByRole('columnheader', { name: /Nombre completo/ })
    ).getByRole('button')
    sortButton.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Nombre completo/ })
      ).toHaveAttribute('aria-sort', 'descending')
    })
  })

  it('toggles sort with Space key on sortable header', async () => {
    renderWithProviders(<DonorsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    const sortButton = within(
      screen.getByRole('columnheader', { name: /Nombre completo/ })
    ).getByRole('button')
    sortButton.focus()
    await user.keyboard(' ')
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /Nombre completo/ })
      ).toHaveAttribute('aria-sort', 'descending')
    })
  })

  it('shows statement links to the report donor-statement tab for each row', async () => {
    renderWithProviders(<DonorsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const statementLinks = screen.getAllByRole('link', {
      name: /Ver donaciones/,
    })
    expect(statementLinks).toHaveLength(2)
    expect(statementLinks[0]).toHaveAttribute(
      'href',
      '/reports?tab=donor-statement&donorId=1'
    )
    expect(statementLinks[1]).toHaveAttribute(
      'href',
      '/reports?tab=donor-statement&donorId=2'
    )
  })

  it('hides statement links for users without report access', async () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ username: 'operator', roles: ['OPERATOR'] })
    )
    renderWithProviders(<DonorsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('link', { name: /Ver donaciones/ })
    ).not.toBeInTheDocument()
    // Edit links remain available to data recorders.
    expect(
      screen.getAllByRole('link', { name: /Editar donante/ })
    ).toHaveLength(2)
  })

  it('edit links have descriptive aria-labels', async () => {
    renderWithProviders(<DonorsPage />)
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    const editLink = screen.getAllByRole('link', { name: /Editar donante/ })
    expect(editLink[0]).toBeInTheDocument()
  })
})
