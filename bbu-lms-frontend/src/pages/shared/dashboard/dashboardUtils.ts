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

export function formatDueLabel(dueAt: string): string {
  const date = parseISO(dueAt)
  if (isToday(date)) return 'Due today'
  if (isTomorrow(date)) return 'Due tomorrow'
  return `Due ${formatDistanceToNow(date, { addSuffix: true })}`
}
