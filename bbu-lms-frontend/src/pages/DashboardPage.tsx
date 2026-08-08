import { LayoutDashboard } from 'lucide-react'

function DashboardPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <LayoutDashboard className="h-7 w-7 text-bbu-blue" />
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Courses', 'Assignments', 'Attendance', 'Messages'].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-text">0</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
