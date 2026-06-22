import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { DonorPicker } from './donor-picker'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('DonorPicker', () => {
  it('renders a combobox with a search placeholder when no value is selected', () => {
    renderWithProviders(<DonorPicker value={null} onChange={vi.fn()} />)
    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveAttribute('id', 'donorId')
    expect(combobox).toHaveAttribute('placeholder', 'Buscar donante…')
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
    expect(combobox).toHaveValue('')
  })

  it('shows the selected donor name when a value is set', async () => {
    renderWithProviders(<DonorPicker value={1} onChange={vi.fn()} />)
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveValue('Juan Pérez')
    )
  })

  it('opens the listbox on focus and lists donors', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DonorPicker value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('combobox'))
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-expanded',
        'true'
      )
    )
    expect(
      await screen.findByRole('option', { name: /Juan Pérez/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /María García/ })
    ).toBeInTheDocument()
  })

  it('filters via server-side search and selects a donor', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<DonorPicker value={null} onChange={onChange} />)

    const combobox = screen.getByRole('combobox')
    await user.click(combobox)
    await user.type(combobox, 'maría')

    await waitFor(() =>
      expect(screen.queryByRole('option', { name: /Juan Pérez/ })).toBeNull()
    )
    const option = await screen.findByRole('option', { name: /María García/ })
    await user.click(option)

    expect(onChange).toHaveBeenCalledWith(2)
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-expanded',
        'false'
      )
    )
  })

  it('selects the highlighted donor with the keyboard', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<DonorPicker value={null} onChange={onChange} />)

    const combobox = screen.getByRole('combobox')
    await user.click(combobox)
    await screen.findByRole('option', { name: /Juan Pérez/ })
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('clears the selection', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<DonorPicker value={1} onChange={onChange} />)
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveValue('Juan Pérez')
    )

    await user.click(screen.getByRole('button', { name: 'Quitar donante' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
