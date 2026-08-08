import { Shield } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

function AdminPage() {
  const tabs = [
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/programs', label: 'Programs' },
    { to: '/admin/semesters', label: 'Semesters' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-7 w-7 text-bbu-blue" />
        <h1 className="text-2xl font-semibold text-text">Administration</h1>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                `border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-bbu-blue text-bbu-blue'
                    : 'border-transparent text-text-muted hover:text-text'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminPage
