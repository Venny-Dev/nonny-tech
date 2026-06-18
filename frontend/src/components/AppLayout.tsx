import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { SidebarProvider, useSidebar } from './SidebarContext'

function Layout() {
  const { open, close } = useSidebar()

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={close}
        />
      )}

      <Sidebar />
      <TopBar />

      <main className="lg:ml-64 mt-16 min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  )
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <Layout />
    </SidebarProvider>
  )
}
