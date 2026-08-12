import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface Notification {
  id: number
  type: 'announcement' | 'message' | 'event'
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

const TYPE_LABELS: Record<Notification['type'], string> = {
  announcement: 'Announcement',
  message: 'Message',
  event: 'Event',
}

export function notificationTypeLabel(type: Notification['type']): string {
  return TYPE_LABELS[type] ?? type
}
