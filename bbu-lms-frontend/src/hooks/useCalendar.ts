import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  type: 'class' | 'assignment' | 'quiz' | 'exam' | 'event'
  startAt: string
  endAt: string | null
  location: string | null
  isAllDay: boolean
  color: string | null
  courseId: number | null
  courseOfferingId: number | null
  course?: { id: number; code: string; name: string } | null
  courseOffering?: { id: number; section: string | null } | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface CalendarEventsData {
  events: CalendarEvent[]
}

export function useCalendarEvents(start: string, end: string) {
  return useQuery<CalendarEventsData, Error>({
    queryKey: ['calendar-events', start, end],
    queryFn: async () => {
      const { data } = await api.get('/calendar/events', {
        params: { start, end },
      })
      return data.data as CalendarEventsData
    },
    enabled: !!start && !!end,
  })
}

export interface CalendarEventInput {
  title: string
  description?: string
  type: CalendarEvent['type']
  startAt: string
  endAt?: string | null
  location?: string
  isAllDay?: boolean
  color?: string
  courseId?: number | null
  courseOfferingId?: number | null
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation<{ event: CalendarEvent }, Error, CalendarEventInput>({
    mutationFn: async (input) => {
      const { data } = await api.post('/calendar/events', input)
      return data.data as { event: CalendarEvent }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation<
    { event: CalendarEvent },
    Error,
    { id: number } & CalendarEventInput
  >({
    mutationFn: async ({ id, ...input }) => {
      const { data } = await api.put(`/calendar/events/${id}`, input)
      return data.data as { event: CalendarEvent }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation<{ deleted: boolean }, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const { data } = await api.delete(`/calendar/events/${id}`)
      return data.data as { deleted: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

const TYPE_COLORS: Record<CalendarEvent['type'], string> = {
  class: '#3b82f6',
  assignment: '#f59e0b',
  quiz: '#8b5cf6',
  exam: '#ef4444',
  event: '#10b981',
}

export function eventColor(event: CalendarEvent): string {
  return event.color ?? TYPE_COLORS[event.type] ?? '#6b7280'
}

export function formatEventTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}
