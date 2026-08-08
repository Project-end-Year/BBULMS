import { TrendingUp } from 'lucide-react'

function CourseGradesTab() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <TrendingUp className="mb-3 h-10 w-10 text-text-muted" />
      <h3 className="text-lg font-medium text-text">Grades</h3>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Gradebook and progress reports are planned for an upcoming step.
      </p>
    </div>
  )
}

export default CourseGradesTab
