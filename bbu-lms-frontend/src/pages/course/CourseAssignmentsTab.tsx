import { ClipboardList } from 'lucide-react'

function CourseAssignmentsTab() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <ClipboardList className="mb-3 h-10 w-10 text-text-muted" />
      <h3 className="text-lg font-medium text-text">Assignments</h3>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Homework, projects, and submission tracking will be available soon.
      </p>
    </div>
  )
}

export default CourseAssignmentsTab
