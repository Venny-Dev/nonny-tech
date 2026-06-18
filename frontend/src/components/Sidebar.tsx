import { NavLink } from 'react-router-dom'
import { useSidebar } from './SidebarContext'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'move_to_inbox', label: 'Shop Incoming', to: '/shop-incoming' },
  { icon: 'payments', label: 'Sales', to: '/sales' },
  { icon: 'build', label: 'Parts', to: '/parts' },
]

export default function Sidebar() {
  const { open, close } = useSidebar()

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
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-y-1">
        {navItems.map(({ icon, label, to }) => (
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
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-y-1">
        <button className="bg-primary text-on-primary mb-4 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all text-sm">
          <span className="material-symbols-outlined text-sm">add</span>
          Quick Report
        </button>
        {[
          { icon: 'settings', label: 'Settings', to: '/settings' },
          { icon: 'help', label: 'Support', to: '/support' },
        ].map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium font-headline ${
                isActive
                  ? 'text-primary bg-surface-container-lowest'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
