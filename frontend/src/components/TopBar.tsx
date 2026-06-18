import { useSidebar } from './SidebarContext'

export default function TopBar() {
  const { toggle } = useSidebar()

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-16 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-4 lg:px-8 z-40 shadow-sm">
      <div className="flex items-center gap-3 flex-1">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Open sidebar"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">
            search
          </span>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Search inventory or orders..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="hidden sm:flex items-center gap-2">
          <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-medium text-sm">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="hidden md:inline">Add Inventory</span>
          </button>
          <button className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full font-bold text-sm hover:scale-95 transition-all">
            Add Sale
          </button>
        </div>

        <div className="flex items-center gap-3 lg:gap-4 lg:border-l border-outline-variant/30 lg:pl-6">
          <button className="material-symbols-outlined text-on-surface-variant">
            notifications
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
            JD
          </div>
        </div>
      </div>
    </header>
  )
}
