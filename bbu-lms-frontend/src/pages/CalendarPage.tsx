import { useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { CalendarDays, Clock, MapPin, Plus, Trash2, X } from 'lucide-react'

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

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const VIEWS: View[] = ['month', 'week', 'day']

const EVENT_TYPES: CalendarEvent['type'][] = [
  'class',
  'assignment',
  'quiz',
  'exam',
  'event',
]

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

function toCalendarEventInput(slotInfo: { start: Date; end: Date }): CalendarEventInput {
  const start = slotInfo.start
  const end = slotInfo.end
  return {
    title: '',
    type: 'event',
    startAt: toDatetimeLocal(start),
    endAt: toDatetimeLocal(end),
    isAllDay: false,
  }
}

interface BigCalendarEvent {
  id: number | string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource: CalendarEvent
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const range = useMemo(() => {
    if (currentView === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start: toISODate(start), end: toISODate(end) }
    }
    if (currentView === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      return { start: toISODate(weekStart), end: toISODate(weekEnd) }
    }
    return { start: toISODate(currentDate), end: toISODate(currentDate) }
  }, [currentDate, currentView])

  const { data, isLoading } = useCalendarEvents(range.start, range.end)
  const { mutate: createEvent, isPending: isCreating } = useCreateCalendarEvent()
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateCalendarEvent()
  const { mutate: deleteEvent } = useDeleteCalendarEvent()

  const events = data?.events ?? []
  const isManager = user?.roles.some((r) => ['admin', 'lecturer'].includes(r.name)) ?? false

  const bigCalendarEvents: BigCalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startAt),
      end: event.endAt ? new Date(event.endAt) : new Date(event.startAt),
      allDay: event.isAllDay,
      resource: event,
    }))
  }, [events])

  function handleSelectSlot(slotInfo: { start: Date; end: Date }) {
    if (!isManager) return
    setEditingEvent(null)
    setIsModalOpen(true)
    // Seed the form with slot info when opening.
    const pendingInput = toCalendarEventInput(slotInfo)
    // The modal uses controlled state; we'll store pending start/end in a global-ish way via the component state below.
    setDraftSlot(pendingInput)
  }

  function handleSelectEvent(bigEvent: BigCalendarEvent) {
    setSelectedEvent(bigEvent.resource)
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
        { onSuccess: () => {
          setIsModalOpen(false)
          setDraftSlot(null)
        } }
      )
    } else {
      createEvent(input, { onSuccess: () => {
        setIsModalOpen(false)
        setDraftSlot(null)
      } })
    }
  }

  const [draftSlot, setDraftSlot] = useState<CalendarEventInput | null>(null)

  function handleAdd() {
    setEditingEvent(null)
    setDraftSlot(null)
    setIsModalOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-bbu-blue" />
          <h1 className="text-xl font-semibold text-text">Calendar</h1>
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

      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-bbu-blue border-t-transparent" />
          </div>
        ) : (
          <Calendar<BigCalendarEvent>
            localizer={localizer}
            events={bigCalendarEvents}
            startAccessor="start"
            endAccessor="end"
            allDayAccessor="allDay"
            views={VIEWS}
            view={currentView}
            date={currentDate}
            onView={setCurrentView}
            onNavigate={setCurrentDate}
            selectable={isManager}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={(bigEvent) => ({
              style: {
                backgroundColor: eventColor(bigEvent.resource),
                borderColor: eventColor(bigEvent.resource),
              },
            })}
            components={{
              event: ({ event }) => (
                <span className="block truncate text-xs font-medium">
                  {sourceBadge(event.resource)
                    ? `${sourceBadge(event.resource)}: ${event.title}`
                    : event.title}
                </span>
              ),
              toolbar: (toolbarProps) => (
                <CalendarToolbar
                  {...toolbarProps}
                  currentView={currentView}
                  onChangeView={setCurrentView}
                />
              ),
            }}
          />
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          canManage={
            isManager &&
            (selectedEvent.createdBy === user?.id ||
              (user?.roles.some((r) => r.name === 'admin') ?? false))
          }
          onClose={() => setSelectedEvent(null)}
          onEdit={() => handleEdit(selectedEvent)}
          onDelete={() => handleDelete(selectedEvent)}
        />
      )}

      {isModalOpen && (
        <EventFormModal
          event={editingEvent}
          draftSlot={draftSlot}
          onClose={() => {
            setIsModalOpen(false)
            setDraftSlot(null)
          }}
          onSave={handleSave}
          isPending={isCreating || isUpdating}
        />
      )}
    </div>
  )
}

interface CalendarToolbarProps {
  label: string
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', date?: Date) => void
  currentView: View
  onChangeView: (view: View) => void
}

function CalendarToolbar({ label, onNavigate, currentView, onChangeView }: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/50 px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('TODAY')}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50"
        >
          Today
        </button>
        <div className="flex items-center rounded-md border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <span className="text-sm font-semibold text-text">{label}</span>
      </div>
      <div className="flex items-center rounded-md border border-gray-200 bg-white">
        {VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onChangeView(view)}
            className={`px-3 py-1.5 text-sm font-medium capitalize ${
              currentView === view
                ? 'bg-bbu-blue text-white'
                : 'text-text hover:bg-gray-50'
            }`}
          >
            {view}
          </button>
        ))}
      </div>
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
  draftSlot: CalendarEventInput | null
  onClose: () => void
  onSave: (input: CalendarEventInput) => void
  isPending: boolean
}

function EventFormModal({ event, draftSlot, onClose, onSave, isPending }: EventFormModalProps) {
  const defaultStart = useMemo(() => {
    if (event) return toDatetimeLocal(new Date(event.startAt))
    if (draftSlot?.startAt) return draftSlot.startAt
    return toDatetimeLocal(new Date())
  }, [event, draftSlot])

  const defaultEnd = useMemo(() => {
    if (event?.endAt) return toDatetimeLocal(new Date(event.endAt))
    if (draftSlot?.endAt) return draftSlot.endAt
    const base = new Date()
    base.setHours(base.getHours() + 1)
    return toDatetimeLocal(base)
  }, [event, draftSlot])

  const [title, setTitle] = useState(event?.title ?? draftSlot?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [type, setType] = useState<CalendarEvent['type']>(event?.type ?? draftSlot?.type ?? 'event')
  const [startAt, setStartAt] = useState(defaultStart)
  const [endAt, setEndAt] = useState(defaultEnd)
  const [location, setLocation] = useState(event?.location ?? '')
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay ?? draftSlot?.isAllDay ?? false)

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
            <label className="mb-1 block text-sm font-medium text-text">Title</label>
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
              <label className="mb-1 block text-sm font-medium text-text">Type</label>
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
              <label className="mb-1 block text-sm font-medium text-text">Location</label>
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
              <label className="mb-1 block text-sm font-medium text-text">Start</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">End</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Description</label>
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
