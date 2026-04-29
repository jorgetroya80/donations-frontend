import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { ExpenseCreatePage } from './expense-create-page'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

describe('ExpenseCreatePage', () => {
  it('renders create page title and form', () => {
    renderWithProviders(<ExpenseCreatePage />)
    expect(screen.getByText('Nuevo gasto')).toBeInTheDocument()
    expect(screen.getByLabelText('Monto')).toBeInTheDocument()
  })

  it('renders Cancel button', () => {
    renderWithProviders(<ExpenseCreatePage />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})
