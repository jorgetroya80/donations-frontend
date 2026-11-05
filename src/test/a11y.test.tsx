import { beforeEach, describe, it } from 'vitest'

import { LoginPage } from '@/features/auth/login-page'
import { DonationCreatePage } from '@/features/donations/donation-create-page'
import { DonorCreatePage } from '@/features/donors/donor-create-page'
import { ExpenseCreatePage } from '@/features/expenses/expense-create-page'
import { ChangePasswordPage } from '@/features/settings/change-password-page'
import { UserCreatePage } from '@/features/users/user-create-page'

import { expectNoSeriousA11yViolations } from './axe-helper'
import { renderWithProviders } from './test-utils'

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

// Form pages: where a missing label or a broken ARIA wiring does the most damage.
describe('form pages have no serious accessibility violations', () => {
  it('LoginPage', async () => {
    const { container } = renderWithProviders(<LoginPage />, {
      route: '/login',
    })
    await expectNoSeriousA11yViolations(container)
  })

  it('DonationCreatePage', async () => {
    const { container } = renderWithProviders(<DonationCreatePage />)
    await expectNoSeriousA11yViolations(container)
  })

  it('DonorCreatePage', async () => {
    const { container } = renderWithProviders(<DonorCreatePage />)
    await expectNoSeriousA11yViolations(container)
  })

  it('ExpenseCreatePage', async () => {
    const { container } = renderWithProviders(<ExpenseCreatePage />)
    await expectNoSeriousA11yViolations(container)
  })

  it('UserCreatePage', async () => {
    const { container } = renderWithProviders(<UserCreatePage />)
    await expectNoSeriousA11yViolations(container)
  })

  it('ChangePasswordPage', async () => {
    const { container } = renderWithProviders(<ChangePasswordPage />, {
      route: '/settings/password',
    })
    await expectNoSeriousA11yViolations(container)
  })
})
