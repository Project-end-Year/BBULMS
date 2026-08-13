import { Link } from 'react-router-dom'
import {
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns'

export function letterGradeColorClass(letter: string | null | undefined): string {
  if (!letter) return 'bg-gray-100 text-text-muted'
  switch (letter) {
    case 'A':
      return 'bg-green-100 text-green-700'
    case 'B':
      return 'bg-blue-100 text-blue-700'
    case 'C':
      return 'bg-amber-100 text-amber-700'
    case 'D':
      return 'bg-orange-100 text-orange-700'
    case 'F':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-text-muted'
  }
}

export function StatCard({
  label,
  value,
  icon: Icon,
  to,
  tone = 'blue',
}: {
  label: string
  value: string | number
  icon: React.ElementType
  to?: string
  tone?: 'blue' | 'green' | 'amber' | 'red'
}) {
  const toneClasses = {
    blue: 'bg-bbu-blue/10 text-bbu-blue',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }

  const content = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  )
}

export function SectionHeader({ icon: Icon, title, to }: { icon: React.ElementType; title: string; to?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">{title}</h3>
      </div>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-bbu-blue hover:underline">
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export function formatDueLabel(dueAt: string): string {
  const date = parseISO(dueAt)
  if (isToday(date)) return 'Due today'
  if (isTomorrow(date)) return 'Due tomorrow'
  return `Due ${formatDistanceToNow(date, { addSuffix: true })}`
}
