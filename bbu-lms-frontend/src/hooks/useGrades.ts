import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'

export type GradeComponentType = 'assignment' | 'attendance' | 'quiz' | 'midterm' | 'final' | 'custom'

export interface GradeComponent {
  id: number
  courseOfferingId: number
  name: string
  type: GradeComponentType
  weight: string
  order: number
  settings: Record<string, unknown> | null
  createdAt: string | null
  updatedAt: string | null
}

export interface GradeComponentFormData {
  name: string
  type: GradeComponentType
  weight: number
  order?: number
  settings?: Record<string, unknown>
}

export interface GradeBreakdownItem {
  component: GradeComponent
  percentage: number | null
  points: number | null
  maxPoints: number | null
  weight: number
  weighted: number
}

export interface StudentGradeSummary {
  breakdown: GradeBreakdownItem[]
  overall: number | null
  letterGrade: string | null
  totalWeight: number
}

export interface GradeEntry {
  id: number
  courseOfferingId: number
  student: { id: number; name: string; email: string } | null
  component: GradeComponent | null
  points: string | null
  maxPoints: string | null
  percentage: string | null
  letterGrade: string | null
  feedback: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface GradeFormData {
  studentId: number
  componentId: number
  points?: number
  maxPoints?: number
  percentage?: number
  feedback?: string
}

const componentsKey = (offeringId: number | undefined) => ['grade-components', offeringId]
const myGradesKey = (offeringId: number | undefined) => ['my-grades', offeringId]
const allGradesKey = (offeringId: number | undefined) => ['grades', offeringId]
const studentGradesKey = (offeringId: number | undefined, studentId: number | undefined = undefined) => ['student-grades', offeringId, studentId]

export function useGradeComponents(offeringId: number | undefined) {
  return useQuery<{ components: GradeComponent[] }, Error>({
    queryKey: componentsKey(offeringId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/grade-components`)
      return data.data as { components: GradeComponent[] }
    },
    enabled: !!offeringId,
  })
}

export function useCreateGradeComponent(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<GradeComponent, Error, GradeComponentFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post(`/course-offerings/${offeringId}/grade-components`, formData)
      return data.data.component as GradeComponent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: componentsKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: myGradesKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: allGradesKey(offeringId) })
      toast.success('Grade component created.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create component.')
    },
  })
}

export function useUpdateGradeComponent(offeringId: number | undefined, componentId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<GradeComponent, Error, GradeComponentFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.put(`/course-offerings/${offeringId}/grade-components/${componentId}`, formData)
      return data.data.component as GradeComponent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: componentsKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: myGradesKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: allGradesKey(offeringId) })
      toast.success('Grade component updated.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update component.')
    },
  })
}

export function useDeleteGradeComponent(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (componentId) => {
      await api.delete(`/course-offerings/${offeringId}/grade-components/${componentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: componentsKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: myGradesKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: allGradesKey(offeringId) })
      toast.success('Grade component deleted.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete component.')
    },
  })
}

export function useMyGrades(offeringId: number | undefined) {
  return useQuery<StudentGradeSummary, Error>({
    queryKey: myGradesKey(offeringId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/grades/me`)
      return data.data as StudentGradeSummary
    },
    enabled: !!offeringId,
  })
}

export function useStudentGrades(offeringId: number | undefined, studentId: number | undefined) {
  return useQuery<StudentGradeSummary & { student: { id: number; name: string; email: string } | null }, Error>({
    queryKey: studentGradesKey(offeringId, studentId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/grades/students/${studentId}`)
      return data.data as StudentGradeSummary & { student: { id: number; name: string; email: string } | null }
    },
    enabled: !!offeringId && !!studentId,
  })
}

export function useAllGrades(offeringId: number | undefined) {
  return useQuery<{ grades: GradeEntry[] }, Error>({
    queryKey: allGradesKey(offeringId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/grades`)
      return data.data as { grades: GradeEntry[] }
    },
    enabled: !!offeringId,
  })
}

export function useSaveGrade(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<GradeEntry, Error, GradeFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post(`/course-offerings/${offeringId}/grades`, formData)
      return data.data.grade as GradeEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allGradesKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: myGradesKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: studentGradesKey(offeringId) })
      toast.success('Grade saved.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save grade.')
    },
  })
}

export function useRecalculateGrades(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<{ recalculated: number }, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(`/course-offerings/${offeringId}/grades/recalculate`)
      return data.data as { recalculated: number }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: allGradesKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: myGradesKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: studentGradesKey(offeringId) })
      toast.success(`Recalculated grades for ${result.recalculated} students.`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to recalculate grades.')
    },
  })
}

export function getLetterGradeColor(letter: string | null | undefined): string {
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
