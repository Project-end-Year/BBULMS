import { Outlet, NavLink } from 'react-router-dom'
import { GraduationCap, LayoutDashboard, BookOpen, MessageSquare, CalendarDays, Shield, LogOut } from 'lucide-react'

function AppLayout() {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/admin', label: 'Admin', icon: Shield },
  ]

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
          <GraduationCap className="h-7 w-7 text-bbu-blue" />
          <span className="text-lg font-semibold text-text">BBU LMS</span>
        </div>

        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
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

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
