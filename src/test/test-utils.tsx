import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderOptions, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { Toaster, ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/features/auth/auth-context'
import { ThemeProvider } from '@/features/theme/theme-context'

interface WrapperOptions {
  route?: string
}

function createWrapper({ route = '/' }: WrapperOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
              <Toaster />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(
  ui: ReactElement,
  options?: WrapperOptions & Omit<RenderOptions, 'wrapper'>
) {
  const { route, ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: createWrapper({ route }),
    ...renderOptions,
  })
}

export { createWrapper, render }
