import '@/lib/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/app-routes'
import { ErrorBoundary } from '@/components/error-boundary'
import { Skeleton } from '@/components/skeleton'
import { Toaster, ToastProvider } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/auth-context'
import { ThemeProvider } from '@/features/theme/theme-context'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <ToastProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <Suspense fallback={<Skeleton />}>
                    <AppRoutes />
                  </Suspense>
                </ErrorBoundary>
              </BrowserRouter>
              <Toaster />
            </ToastProvider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
