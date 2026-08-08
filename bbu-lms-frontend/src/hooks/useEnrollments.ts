import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface EnrollmentStudent {
  id: number
  name: string
  email: string
  avatarUrl?: string | null
}

export interface EnrollmentItem {
  id: number
  student: EnrollmentStudent
  status: 'enrolled' | 'dropped'
  enrolledAt: string | null
  droppedAt: string | null
  finalGrade: number | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface EnrollmentsData {
  enrollments: EnrollmentItem[]
  capacity: number | null
  enrolledCount: number
}

export interface SearchStudentResult {
  id: number
  name: string
  email: string
  studentId?: string | null
}

export function useEnrollments(offeringId: number | undefined) {
  return useQuery<EnrollmentsData, Error>({
    queryKey: ['enrollments', offeringId],
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/enrollments`)
      return data.data as EnrollmentsData
    },
    enabled: !!offeringId,
  })
}

export function useSearchStudents(query: string) {
  return useQuery<SearchStudentResult[], Error>({
    queryKey: ['student-search', query],
    queryFn: async () => {
      const { data } = await api.get('/students/search', { params: { query } })
      return data.data.students as SearchStudentResult[]
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
  })
}

export function useEnrollStudent(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<EnrollmentItem, Error, { studentId?: number }>({
    mutationFn: async ({ studentId }) => {
      const payload = studentId ? { studentId } : {}
      const { data } = await api.post(`/course-offerings/${offeringId}/enrollments`, payload)
      return data.data as EnrollmentItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', offeringId] })
      queryClient.invalidateQueries({ queryKey: ['course-detail'] })
    },
  })
}

export function useDropStudent(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { studentId: number }>({
    mutationFn: async ({ studentId }) => {
      await api.delete(`/course-offerings/${offeringId}/enrollments/${studentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', offeringId] })
      queryClient.invalidateQueries({ queryKey: ['course-detail'] })
    },
  })
}

export function useSelfEnroll(offeringId: number | undefined) {
  const enroll = useEnrollStudent(offeringId)

  return {
    ...enroll,
    mutate: () => enroll.mutate({}),
    mutateAsync: () => enroll.mutateAsync({}),
  }
}
