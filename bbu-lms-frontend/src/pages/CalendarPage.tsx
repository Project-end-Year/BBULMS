import { CalendarDays } from 'lucide-react'

function CalendarPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <CalendarDays className="h-7 w-7 text-bbu-blue" />
        <h1 className="text-2xl font-semibold text-text">Calendar</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-text-muted">Calendar view will be implemented in Step 52+.</p>
      </div>
    </div>
  )
}

export default CalendarPage
