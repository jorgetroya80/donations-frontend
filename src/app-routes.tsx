import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from '@/features/auth/protected-route'
import { RoleRoute } from '@/features/auth/role-route'
import { AppLayout } from '@/layouts/app-layout'
import {
  canManageUsers,
  canRecordData,
  canViewReports,
} from '@/lib/permissions'

const LoginPage = lazy(() =>
  import('@/features/auth/login-page').then((m) => ({ default: m.LoginPage }))
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/dashboard-page').then((m) => ({
    default: m.DashboardPage,
  }))
)
const DonationsPage = lazy(() =>
  import('@/features/donations/donations-page').then((m) => ({
    default: m.DonationsPage,
  }))
)
const DonationCreatePage = lazy(() =>
  import('@/features/donations/donation-create-page').then((m) => ({
    default: m.DonationCreatePage,
  }))
)
const DonationEditPage = lazy(() =>
  import('@/features/donations/donation-edit-page').then((m) => ({
    default: m.DonationEditPage,
  }))
)
const DonorsPage = lazy(() =>
  import('@/features/donors/donors-page').then((m) => ({
    default: m.DonorsPage,
  }))
)
const DonorCreatePage = lazy(() =>
  import('@/features/donors/donor-create-page').then((m) => ({
    default: m.DonorCreatePage,
  }))
)
const DonorEditPage = lazy(() =>
  import('@/features/donors/donor-edit-page').then((m) => ({
    default: m.DonorEditPage,
  }))
)
const ExpensesPage = lazy(() =>
  import('@/features/expenses/expenses-page').then((m) => ({
    default: m.ExpensesPage,
  }))
)
const ExpenseCreatePage = lazy(() =>
  import('@/features/expenses/expense-create-page').then((m) => ({
    default: m.ExpenseCreatePage,
  }))
)
const ExpenseEditPage = lazy(() =>
  import('@/features/expenses/expense-edit-page').then((m) => ({
    default: m.ExpenseEditPage,
  }))
)
const ReportsPage = lazy(() =>
  import('@/features/reports/reports-page').then((m) => ({
    default: m.ReportsPage,
  }))
)
const ChangePasswordPage = lazy(() =>
  import('@/features/settings/change-password-page').then((m) => ({
    default: m.ChangePasswordPage,
  }))
)
const UsersPage = lazy(() =>
  import('@/features/users/users-page').then((m) => ({
    default: m.UsersPage,
  }))
)
const UserCreatePage = lazy(() =>
  import('@/features/users/user-create-page').then((m) => ({
    default: m.UserCreatePage,
  }))
)
const UserEditPage = lazy(() =>
  import('@/features/users/user-edit-page').then((m) => ({
    default: m.UserEditPage,
  }))
)

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/settings/password" element={<ChangePasswordPage />} />
          <Route element={<RoleRoute check={canRecordData} />}>
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/donations/new" element={<DonationCreatePage />} />
            <Route path="/donations/:id/edit" element={<DonationEditPage />} />
            <Route path="/donors" element={<DonorsPage />} />
            <Route path="/donors/new" element={<DonorCreatePage />} />
            <Route path="/donors/:id/edit" element={<DonorEditPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expenses/new" element={<ExpenseCreatePage />} />
            <Route path="/expenses/:id/edit" element={<ExpenseEditPage />} />
          </Route>
          <Route element={<RoleRoute check={canViewReports} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route element={<RoleRoute check={canManageUsers} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/new" element={<UserCreatePage />} />
            <Route path="/users/:id/edit" element={<UserEditPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
