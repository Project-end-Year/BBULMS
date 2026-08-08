import { BookOpen } from 'lucide-react'

function CoursesPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-bbu-blue" />
        <h1 className="text-2xl font-semibold text-text">My Courses</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-text-muted">Course cards will appear here once Step 23 is built.</p>
      </div>
    </div>
  )
}

export default CoursesPage
