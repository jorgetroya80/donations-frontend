import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router'
import { ErrorBoundary } from '@/components/error-boundary'
import { Skeleton } from '@/components/skeleton'
import { Header } from './header'
import { getStoredCollapsed, SIDEBAR_KEY, Sidebar } from './sidebar'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(getStoredCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  function handleToggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }

  function closeMobile() {
    setMobileOpen(false)
    menuButtonRef.current?.focus()
  }

  useEffect(() => {
    if (!mobileOpen) return
    drawerRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="fixed inset-y-0 left-0 outline-none"
          >
            <Sidebar collapsed={false} onNavigate={closeMobile} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          menuButtonRef={menuButtonRef}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
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
