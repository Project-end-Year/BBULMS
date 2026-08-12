import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'
import { formatFileSize } from './useCourseMaterials'

export type SubmissionStatus = 'submitted' | 'late' | 'graded' | string

export interface SubmissionFile {
  fileName: string
  originalName: string
  path: string
  mimeType: string
  size: number
}

export interface AssignmentSubmission {
  id: number
  assignmentId: number
  student: { id: number; name: string; email: string } | null
  attemptNumber: number
  submissionText: string | null
  files: SubmissionFile[] | null
  submittedAt: string | null
  grade: string | null
  feedback: string | null
  gradedBy: { id: number; name: string; email: string } | null
  gradedAt: string | null
  status: SubmissionStatus
  createdAt: string | null
  updatedAt: string | null
}

export interface Assignment {
  id: number
  courseOfferingId: number
  title: string
  description: string | null
  instructions: string | null
  dueAt: string
  maxPoints: string
  allowedAttempts: number
  allowedFileTypes: string[] | null
  maxFileSizeMb: number
  isPublished: boolean
  createdBy: number
  submissionsCount?: number | null
  submissions?: AssignmentSubmission[]
  createdAt: string | null
  updatedAt: string | null
}

export interface AssignmentsData {
  assignments: Assignment[]
}

export interface AssignmentFormData {
  title: string
  description?: string
  instructions?: string
  dueAt: string
  maxPoints?: number
  allowedAttempts?: number
  allowedFileTypes?: string[]
  maxFileSizeMb?: number
  isPublished?: boolean
}

export interface SubmissionFormData {
  submissionText?: string
  files?: File[]
}

export interface GradeFormData {
  grade: number
  feedback?: string
}

const assignmentsKey = (offeringId: number | undefined) => ['course-assignments', offeringId]
const assignmentKey = (offeringId: number | undefined, assignmentId: number | undefined) => [
  'course-assignment',
  offeringId,
  assignmentId,
]
const submissionsKey = (offeringId: number | undefined, assignmentId: number | undefined) => [
  'assignment-submissions',
  offeringId,
  assignmentId,
]
const mySubmissionKey = (offeringId: number | undefined, assignmentId: number | undefined) => [
  'my-submission',
  offeringId,
  assignmentId,
]

export function useAssignments(offeringId: number | undefined) {
  return useQuery<AssignmentsData, Error>({
    queryKey: assignmentsKey(offeringId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/assignments`)
      return data.data as AssignmentsData
    },
    enabled: !!offeringId,
  })
}

export function useAssignment(offeringId: number | undefined, assignmentId: number | undefined) {
  return useQuery<{ assignment: Assignment }, Error>({
    queryKey: assignmentKey(offeringId, assignmentId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/assignments/${assignmentId}`)
      return data.data as { assignment: Assignment }
    },
    enabled: !!offeringId && !!assignmentId,
  })
}

export function useCreateAssignment(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<Assignment, Error, AssignmentFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post(`/course-offerings/${offeringId}/assignments`, formData)
      return data.data.assignment as Assignment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKey(offeringId) })
      toast.success('Assignment created.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create assignment.')
    },
  })
}

export function useUpdateAssignment(offeringId: number | undefined, assignmentId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<Assignment, Error, AssignmentFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.put(`/course-offerings/${offeringId}/assignments/${assignmentId}`, formData)
      return data.data.assignment as Assignment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: assignmentKey(offeringId, assignmentId) })
      toast.success('Assignment updated.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update assignment.')
    },
  })
}

export function useDeleteAssignment(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (assignmentId) => {
      await api.delete(`/course-offerings/${offeringId}/assignments/${assignmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKey(offeringId) })
      toast.success('Assignment deleted.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete assignment.')
    },
  })
}

export function useSubmissions(offeringId: number | undefined, assignmentId: number | undefined) {
  return useQuery<{ submissions: AssignmentSubmission[] }, Error>({
    queryKey: submissionsKey(offeringId, assignmentId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/assignments/${assignmentId}/submissions`)
      return data.data as { submissions: AssignmentSubmission[] }
    },
    enabled: !!offeringId && !!assignmentId,
  })
}

export function useMySubmission(offeringId: number | undefined, assignmentId: number | undefined) {
  return useQuery<{ submission: AssignmentSubmission | null }, Error>({
    queryKey: mySubmissionKey(offeringId, assignmentId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/assignments/${assignmentId}/my-submission`)
      return data.data as { submission: AssignmentSubmission | null }
    },
    enabled: !!offeringId && !!assignmentId,
  })
}

export function useSubmitAssignment(offeringId: number | undefined, assignmentId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<AssignmentSubmission, Error, SubmissionFormData>({
    mutationFn: async (formData) => {
      const payload = new FormData()
      if (formData.submissionText) {
        payload.append('submissionText', formData.submissionText)
      }
      if (formData.files) {
        formData.files.forEach((file) => payload.append('files[]', file))
      }

      const { data } = await api.post(
        `/course-offerings/${offeringId}/assignments/${assignmentId}/submissions`,
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data.data.submission as AssignmentSubmission
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mySubmissionKey(offeringId, assignmentId) })
      queryClient.invalidateQueries({ queryKey: submissionsKey(offeringId, assignmentId) })
      queryClient.invalidateQueries({ queryKey: assignmentsKey(offeringId) })
      toast.success('Submission received.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit assignment.')
    },
  })
}

export function useGradeSubmission(
  offeringId: number | undefined,
  assignmentId: number | undefined,
  submissionId: number | undefined
) {
  const queryClient = useQueryClient()

  return useMutation<AssignmentSubmission, Error, GradeFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post(
        `/course-offerings/${offeringId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        formData
      )
      return data.data.submission as AssignmentSubmission
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionsKey(offeringId, assignmentId) })
      queryClient.invalidateQueries({ queryKey: mySubmissionKey(offeringId, assignmentId) })
      toast.success('Submission graded.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to grade submission.')
    },
  })
}

export { formatFileSize }

export function formatDueDate(value: string | null | undefined): string {
  if (!value) return 'No due date'
  const date = new Date(value)
  const formatted = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const isPast = date < new Date()
  return `${formatted}${isPast ? ' (Past due)' : ''}`
}
