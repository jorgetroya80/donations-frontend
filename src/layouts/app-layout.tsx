import { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { ErrorBoundary } from '@/components/error-boundary'
import { Skeleton } from '@/components/skeleton'
import { Header } from './header'
import { getStoredCollapsed, SIDEBAR_KEY, Sidebar } from './sidebar'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(getStoredCollapsed)

  function handleToggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <ErrorBoundary>
            <Suspense fallback={<Skeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
