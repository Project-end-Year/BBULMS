import { LayoutDashboard, AlertCircle } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import StudentDashboardPage from '@/pages/student/StudentDashboardPage'
import LecturerDashboardPage from '@/pages/lecturer/LecturerDashboardPage'

function DashboardPage() {
  const { user } = useAuth()

  const isStudent = user?.roles?.some((r) => r.name === 'student')
  const isLecturer = user?.roles?.some((r) => r.name === 'lecturer')

  if (isStudent) {
    return <StudentDashboardPage />
  }

  if (isLecturer) {
    return <LecturerDashboardPage />
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <LayoutDashboard className="h-7 w-7 text-bbu-blue" />
        <div>
          <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
          <p className="text-sm text-text-muted">Welcome back.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-base font-semibold text-text">Staff Dashboard</h3>
            <p className="text-sm text-text-muted">
              Detailed analytics and administrative tools are available from the Admin section.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
