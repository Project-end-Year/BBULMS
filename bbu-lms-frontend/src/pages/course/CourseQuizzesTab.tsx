import { HelpCircle } from 'lucide-react'

function CourseQuizzesTab() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <HelpCircle className="mb-3 h-10 w-10 text-text-muted" />
      <h3 className="text-lg font-medium text-text">Quizzes</h3>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Online quizzes and exams are coming in a future step.
      </p>
    </div>
  )
}

export default CourseQuizzesTab
