import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export type AnnouncementScope = 'course' | 'department' | 'university'

export interface Announcement {
  id: number
  courseId: number | null
  scope: AnnouncementScope
  departmentId: number | null
  department: { id: number; code: string; name: string } | null
  course: { id: number; code: string; name: string } | null
  title: string
  content: string
  postedBy: { id: number; name: string } | null
  isPinned: boolean
  isPublished: boolean
  publishedAt: string | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface AnnouncementsData {
  announcements: Announcement[]
}

export interface AnnouncementFormData {
  title: string
  content: string
  scope?: AnnouncementScope
  departmentId?: number
  isPinned?: boolean
  isPublished?: boolean
}

export function useAnnouncements(courseId: string | undefined) {
  return useQuery<AnnouncementsData, Error>({
    queryKey: ['course-announcements', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/announcements`)
      return data.data as AnnouncementsData
    },
    enabled: !!courseId,
  })
}

export function useAllAnnouncements(scope?: AnnouncementScope) {
  return useQuery<AnnouncementsData, Error>({
    queryKey: ['all-announcements', scope],
    queryFn: async () => {
      const params = scope ? { scope } : undefined
      const { data } = await api.get('/announcements', { params })
      return data.data as AnnouncementsData
    },
  })
}

export function useCreateAnnouncement(courseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<Announcement, Error, AnnouncementFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post(`/courses/${courseId}/announcements`, formData)
      return data.data as Announcement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-announcements', courseId] })
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] })
    },
  })
}

export function useUpdateAnnouncement(courseId: string | undefined, announcementId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<Announcement, Error, AnnouncementFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.put(`/courses/${courseId}/announcements/${announcementId}`, formData)
      return data.data as Announcement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-announcements', courseId] })
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] })
    },
  })
}

export function useToggleAnnouncement(courseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (announcementId) => {
      await api.delete(`/courses/${courseId}/announcements/${announcementId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-announcements', courseId] })
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] })
    },
  })
}
