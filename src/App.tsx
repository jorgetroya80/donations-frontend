import '@/lib/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/auth-context'
import { LoginPage } from '@/features/auth/login-page'
import { ProtectedRoute } from '@/features/auth/protected-route'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { DonationCreatePage } from '@/features/donations/donation-create-page'
import { DonationEditPage } from '@/features/donations/donation-edit-page'
import { DonationsPage } from '@/features/donations/donations-page'
import { DonorCreatePage } from '@/features/donors/donor-create-page'
import { DonorEditPage } from '@/features/donors/donor-edit-page'
import { DonorsPage } from '@/features/donors/donors-page'
import { ExpenseCreatePage } from '@/features/expenses/expense-create-page'
import { ExpenseEditPage } from '@/features/expenses/expense-edit-page'
import { ExpensesPage } from '@/features/expenses/expenses-page'
import { AdminRoute } from '@/features/users/admin-route'
import { UserCreatePage } from '@/features/users/user-create-page'
import { UserEditPage } from '@/features/users/user-edit-page'
import { UsersPage } from '@/features/users/users-page'
import { AppLayout } from '@/layouts/app-layout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/donations" element={<DonationsPage />} />
                  <Route
                    path="/donations/new"
                    element={<DonationCreatePage />}
                  />
                  <Route
                    path="/donations/:id/edit"
                    element={<DonationEditPage />}
                  />
                  <Route path="/donors" element={<DonorsPage />} />
                  <Route path="/donors/new" element={<DonorCreatePage />} />
                  <Route path="/donors/:id/edit" element={<DonorEditPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/expenses/new" element={<ExpenseCreatePage />} />
                  <Route
                    path="/expenses/:id/edit"
                    element={<ExpenseEditPage />}
                  />
                  <Route element={<AdminRoute />}>
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/users/new" element={<UserCreatePage />} />
                    <Route path="/users/:id/edit" element={<UserEditPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
