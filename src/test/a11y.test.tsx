import { screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, it, vi } from 'vitest'

import { LoginPage } from '@/features/auth/login-page'
import { DonationCreatePage } from '@/features/donations/donation-create-page'
import { DonationEditPage } from '@/features/donations/donation-edit-page'
import { DonorCreatePage } from '@/features/donors/donor-create-page'
import { DonorEditPage } from '@/features/donors/donor-edit-page'
import { ExpenseCreatePage } from '@/features/expenses/expense-create-page'
import { ExpenseEditPage } from '@/features/expenses/expense-edit-page'
import { ChangePasswordPage } from '@/features/settings/change-password-page'
import { UserCreatePage } from '@/features/users/user-create-page'
import { UserEditPage } from '@/features/users/user-edit-page'

import { expectNoSeriousA11yViolations } from './axe-helper'
import { renderWithProviders } from './test-utils'

// Edit pages read their id from the route. Same id the other edit-page tests use.
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  }
})

beforeEach(() => {
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ username: 'admin', roles: ['ADMIN'] })
  )
})

// Edit pages show a skeleton until the entity loads, so wait for the form's submit button.
async function renderAndExpectAccessible(
  ui: ReactElement,
  { route, submit = 'Guardar' }: { route?: string; submit?: string } = {}
) {
  const { container } = renderWithProviders(ui, { route })
  await screen.findByRole('button', { name: submit })
  await expectNoSeriousA11yViolations(container)
}

// Every form page in the app: create, edit, login and password change.
describe('form pages have no serious accessibility violations', () => {
  it('LoginPage', () => {
    // A signed-in user is redirected away from /login, so sign out first.
    localStorage.clear()
    return renderAndExpectAccessible(<LoginPage />, {
      route: '/login',
      submit: 'Ingresar',
    })
  })

  it('ChangePasswordPage', () =>
    renderAndExpectAccessible(<ChangePasswordPage />, {
      route: '/settings/password',
    }))

  it('DonationCreatePage', () =>
    renderAndExpectAccessible(<DonationCreatePage />))

  it('DonationEditPage', () => renderAndExpectAccessible(<DonationEditPage />))

  it('DonorCreatePage', () => renderAndExpectAccessible(<DonorCreatePage />))

  it('DonorEditPage', () => renderAndExpectAccessible(<DonorEditPage />))

  it('ExpenseCreatePage', () =>
    renderAndExpectAccessible(<ExpenseCreatePage />))

  it('ExpenseEditPage', () => renderAndExpectAccessible(<ExpenseEditPage />))

  it('UserCreatePage', () => renderAndExpectAccessible(<UserCreatePage />))

  it('UserEditPage', () => renderAndExpectAccessible(<UserEditPage />))
})
