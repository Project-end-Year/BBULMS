import { FileText } from 'lucide-react'

function CourseMaterialsTab() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <FileText className="mb-3 h-10 w-10 text-text-muted" />
      <h3 className="text-lg font-medium text-text">Materials</h3>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Lecture notes, slides, and files will appear here in a later step.
      </p>
    </div>
  )
}

export default CourseMaterialsTab
