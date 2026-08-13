import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/axios'
import { useAuth } from '@/contexts/AuthContext'
import { useEcho } from '@/contexts/EchoContext'

export type NotificationType =
  | 'announcement'
  | 'chat_message'
  | 'exam_reminder'
  | 'new_assignment'
  | 'deadline'
  | 'new_grade'
  | 'attendance_reminder'
  | 'event'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown> | null
  actionUrl: string | null
  readAt: string | null
  createdAt: string
}

export interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
}

export function useNotifications() {
  return useQuery<NotificationsData, Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications')
      return data.data as NotificationsData
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation<{ read: boolean }, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const { data } = await api.post(`/notifications/${id}/read`)
      return data.data as { read: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation<{ read: boolean }, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post('/notifications/mark-all-read')
      return data.data as { read: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

const TYPE_LABELS: Record<NotificationType, string> = {
  announcement: 'Announcement',
  chat_message: 'Message',
  exam_reminder: 'Exam',
  new_assignment: 'Assignment',
  deadline: 'Deadline',
  new_grade: 'Grade',
  attendance_reminder: 'Attendance',
  event: 'Event',
}

export function notificationTypeLabel(type: NotificationType): string {
  return TYPE_LABELS[type] ?? type
}

/**
 * Listen for real-time notification broadcasts on the user's private channel
 * and refresh the notification feed.
 */
export function useListenNotifications(enabled = true) {
  const { user } = useAuth()
  const { echo, connected } = useEcho()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !echo || !connected || !user) {
      return
    }

    const channel = echo.private(`App.Models.User.${user.id}`)
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }

    channel.listen('.notification.created', handler)

    return () => {
      channel.stopListening('.notification.created')
    }
  }, [echo, connected, enabled, queryClient, user])
}
