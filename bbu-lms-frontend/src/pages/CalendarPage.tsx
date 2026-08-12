import { useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  eventColor,
  sourceBadge,
  type CalendarEvent,
  type CalendarEventInput,
} from '@/hooks/useCalendar'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const EVENT_TYPES: CalendarEvent['type'][] = [
  'class',
  'assignment',
  'quiz',
  'exam',
  'event',
]

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDatetimeLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const start = useMemo(() => toISODate(startOfMonth(currentMonth)), [currentMonth])
  const end = useMemo(() => toISODate(endOfMonth(currentMonth)), [currentMonth])

  const { data, isLoading } = useCalendarEvents(start, end)
  const { mutate: createEvent, isPending: isCreating } = useCreateCalendarEvent()
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateCalendarEvent()
  const { mutate: deleteEvent } = useDeleteCalendarEvent()

  const events = data?.events ?? []
  const isManager = user?.roles.some((r) => ['admin', 'lecturer'].includes(r.name)) ?? false

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(currentMonth)
    const lastDay = endOfMonth(currentMonth)
    const startOffset = firstDay.getDay()
    const days: Date[] = []

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), -i))
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), i))
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(lastDay.getFullYear(), lastDay.getMonth() + 1, i))
    }

    return days
  }, [currentMonth])

  function eventsForDay(day: Date): CalendarEvent[] {
    const dateStr = toISODate(day)
    return events.filter((event) => {
      const eventStart = new Date(event.startAt)
      const eventDate = toISODate(eventStart)
      return eventDate === dateStr
    })
  }

  function handlePrev() {
    setCurrentMonth((prev) => addMonths(prev, -1))
  }

  function handleNext() {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  function handleToday() {
    setCurrentMonth(startOfMonth(new Date()))
  }

  function handleAdd() {
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  function handleEdit(event: CalendarEvent) {
    if (event.sourceType) return
    setEditingEvent(event)
    setIsModalOpen(true)
    setSelectedEvent(null)
  }

  function handleDelete(event: CalendarEvent) {
    if (window.confirm(`Delete "${event.title}"?`)) {
      deleteEvent({ id: event.id })
      setSelectedEvent(null)
    }
  }

  function handleSave(input: CalendarEventInput) {
    if (editingEvent) {
      updateEvent(
        { id: editingEvent.id, ...input },
        { onSuccess: () => setIsModalOpen(false) }
      )
    } else {
      createEvent(input, { onSuccess: () => setIsModalOpen(false) })
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-bbu-blue" />
          <h1 className="text-xl font-semibold text-text">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50"
          >
            Today
          </button>
          <div className="flex items-center rounded-md border border-gray-200 bg-white">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 text-text-muted hover:bg-gray-50 hover:text-text"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] px-2 text-center text-sm font-medium text-text">
              {formatMonthYear(currentMonth)}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 text-text-muted hover:bg-gray-50 hover:text-text"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {isManager && (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1 rounded-md bg-bbu-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-bbu-blue/90"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-semibold text-text-muted"
            >
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-bbu-blue border-t-transparent" />
          </div>
        ) : (
          <div className="grid h-[calc(100%-2.5rem)] grid-cols-7 grid-rows-6 overflow-y-auto">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isToday = toISODate(day) === toISODate(new Date())
              const dayEvents = eventsForDay(day)

              return (
                <div
                  key={index}
                  className={`min-h-[80px] border-b border-r border-gray-100 p-2 transition-colors hover:bg-gray-50 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50/50 text-text-muted'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center text-xs ${
                        isToday
                          ? 'rounded-full bg-bbu-blue font-semibold text-white'
                          : ''
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-white"
                        style={{ backgroundColor: eventColor(event) }}
                        title={event.title}
                      >
                        {sourceBadge(event) ? `${sourceBadge(event)}: ` : ''}
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-text-muted">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          canManage={isManager && (selectedEvent.createdBy === user?.id || (user?.roles.some((r) => r.name === 'admin') ?? false))}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => handleEdit(selectedEvent)}
          onDelete={() => handleDelete(selectedEvent)}
        />
      )}

      {isModalOpen && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          isPending={isCreating || isUpdating}
        />
      )}
    </div>
  )
}

interface EventDetailModalProps {
  event: CalendarEvent
  canManage: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function EventDetailModal({
  event,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: EventDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <span
              className="mb-2 inline-block rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: eventColor(event) }}
            >
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </span>
            <h3 className="text-lg font-semibold text-text">{event.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-text-muted hover:bg-gray-100 hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-text">
          {event.description && <p className="text-text-muted">{event.description}</p>}
          {sourceBadge(event) && (
            <p className="text-xs font-medium text-text-muted">
              Source: {sourceBadge(event)}
            </p>
          )}
          <div className="flex items-center gap-2 text-text-muted">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(event.startAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {event.endAt && (
                <>
                  {' — '}
                  {new Date(event.endAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-text-muted">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
          {event.course && (
            <p className="text-text-muted">
              Course: {event.course.code} — {event.course.name}
            </p>
          )}
        </div>

        {canManage && !event.sourceType && (
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md bg-bbu-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-bbu-blue/90"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface EventFormModalProps {
  event: CalendarEvent | null
  onClose: () => void
  onSave: (input: CalendarEventInput) => void
  isPending: boolean
}

function EventFormModal({ event, onClose, onSave, isPending }: EventFormModalProps) {
  const defaultStart = useMemo(() => {
    const base = event ? new Date(event.startAt) : new Date()
    return toDatetimeLocal(base)
  }, [event])
  const defaultEnd = useMemo(() => {
    const base = event?.endAt ? new Date(event.endAt) : new Date()
    if (!event?.endAt) base.setHours(base.getHours() + 1)
    return toDatetimeLocal(base)
  }, [event])

  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [type, setType] = useState<CalendarEvent['type']>(event?.type ?? 'event')
  const [startAt, setStartAt] = useState(defaultStart)
  const [endAt, setEndAt] = useState(defaultEnd)
  const [location, setLocation] = useState(event?.location ?? '')
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay ?? false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      startAt,
      endAt: endAt || null,
      location: location.trim() || undefined,
      isAllDay,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">
            {event ? 'Edit Event' : 'New Event'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-text-muted hover:bg-gray-100 hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CalendarEvent['type'])}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                Start
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                End
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
            />
            All day
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="rounded-md bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : event ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
