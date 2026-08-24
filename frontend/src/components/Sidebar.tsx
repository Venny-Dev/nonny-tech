import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSidebar } from './SidebarContext'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from './ui/Icon'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { usePendingTransferCount } from '../hooks/useTransfers'
import { usePendingStockRequestCount, useRespondedStockRequestCount } from '../hooks/useStockRequests'
import type { UserRole } from '../services/authService'

interface NavItem {
  icon: string
  label: string
  to: string
  roles?: UserRole[]
  section?: string
}

const navItems: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'inventory', label: 'Warehouse Incoming', to: '/warehouse-incoming', roles: ['admin', 'warehouse'] },
  { icon: 'move_to_inbox', label: 'Shop Incoming', to: '/shop-incoming', roles: ['admin', 'shop'] },
  { icon: 'hub', label: 'Transfers', to: '/transfers' },
  { icon: 'payments', label: 'Shop Sales', to: '/sales/shop', roles: ['admin', 'shop'] },
  { icon: 'payments', label: 'Warehouse Sales', to: '/sales/warehouse', roles: ['admin', 'warehouse'] },
  { icon: 'today', label: 'Daily Report', to: '/daily-report' },
  { icon: 'help', label: 'Stock Requests', to: '/stock-requests' },
]

export default function Sidebar() {
  const { open, close } = useSidebar()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)
  const pendingTransfers = usePendingTransferCount()
  const pendingStockRequests = usePendingStockRequestCount()
  const stockRequestBadge = user?.role === 'shop' ? 0 : pendingStockRequests

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true
    if (!user) return false
    return item.roles.includes(user.role)
  })

  return (
    <aside
      className={`h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col p-6 gap-y-2 z-50 transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h1 className="text-xl font-bold text-on-surface font-headline">NonnyTech</h1>
          <p className="text-xs text-on-surface-variant">Admin Console</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={close}
          className="lg:hidden text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Close sidebar"
        >
          <Icon name="close" />
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-y-1">
        {visibleItems.map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-headline text-sm font-medium ${
                isActive
                  ? 'text-primary bg-surface-container-lowest shadow-sm translate-x-1 font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`
            }
          >
            <Icon name={icon} />
            <span className="flex-1">{label}</span>
            {to === '/transfers' && pendingTransfers > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-error text-on-error text-[10px] font-bold leading-none">
                {pendingTransfers > 99 ? '99+' : pendingTransfers}
              </span>
            )}
            {to === '/stock-requests' && stockRequestBadge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
                {stockRequestBadge > 99 ? '99+' : stockRequestBadge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-outline-variant/20">
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium font-headline text-on-surface-variant hover:bg-surface-container w-full"
        >
          <Icon name="login" className="rotate-180" />
          <span>Logout</span>
        </button>
      </div>

      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogout(false)}>Cancel</Button>
            <Button onClick={() => { setShowLogout(false); logout(); navigate('/login') }}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
