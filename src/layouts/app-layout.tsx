import { useState } from 'react'
import { Outlet } from 'react-router'
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
          <Outlet />
        </main>
      </div>
    </div>
  )
}
