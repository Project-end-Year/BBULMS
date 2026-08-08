import { Users } from 'lucide-react'

function CourseAttendanceTab() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <Users className="mb-3 h-10 w-10 text-text-muted" />
      <h3 className="text-lg font-medium text-text">Attendance</h3>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Attendance records and session history will be added later.
      </p>
    </div>
  )
}

export default CourseAttendanceTab
