import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  CalendarDays,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/admin', label: 'Admin', icon: Shield },
]

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const activeLabel = navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? 'BBU LMS'

  const sidebarClasses = sidebarOpen ? 'w-64' : 'w-18'

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded p-2 text-text-muted hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden rounded p-2 text-text-muted hover:bg-gray-100 lg:block"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-bbu-blue" />
            <span className="hidden text-lg font-semibold text-text sm:block">BBU LMS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded p-2 text-text-muted hover:bg-gray-100"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="rounded p-2 text-text-muted hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="ml-2 hidden h-8 w-8 items-center justify-center rounded-full bg-bbu-blue text-xs font-medium text-white sm:flex">
            U
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside
          className={`hidden flex-col border-r border-gray-200 bg-white transition-all duration-200 lg:flex ${sidebarClasses}`}
        >
          <div className="flex flex-1 flex-col overflow-y-auto py-3">
            <nav className="flex-1 px-3">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-bbu-blue/10 text-bbu-blue'
                            : 'text-text-muted hover:bg-gray-100 hover:text-text'
                        }`
                      }
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="border-t border-gray-200 p-3">
            <button
              type="button"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-text ${
                !sidebarOpen && 'justify-center'
              }`}
              title={!sidebarOpen ? 'Sign out' : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Sign out</span>}
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 lg:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-bbu-blue" />
              <span className="text-lg font-semibold text-text">BBU LMS</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded p-2 text-text-muted hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-bbu-blue/10 text-bbu-blue'
                          : 'text-text-muted hover:bg-gray-100 hover:text-text'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-gray-200 p-4">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-text"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-text sm:text-2xl">{activeLabel}</h1>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
