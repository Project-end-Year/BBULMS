import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'
import type { User } from '@/contexts/AuthContext'

export interface CourseOffering {
  id: number
  course: Course
  semester: { id: number; name: string; startDate?: string | null; endDate?: string | null }
  lecturer?: User | null
  capacity?: number | null
  section?: string | null
  room?: string | null
  schedule?: { days?: string[]; start?: string; end?: string } | null
  enrollmentCount?: number
  isActive: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export interface Course {
  id: number
  code: string
  name: string
  description?: string | null
  credits: number
  isActive: boolean
  department?: { id: number; code: string; name: string } | null
  program?: { id: number; code: string; name: string } | null
  offerings?: unknown[]
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CourseFormMeta {
  departments: { id: number; code: string; name: string }[]
  programs: { id: number; code: string; name: string; department?: { id: number; code: string; name: string } }[]
  semesters: { id: number; name: string }[]
  lecturers: { id: number; name: string; email: string }[]
}

export interface CourseFilters {
  search?: string
  departmentId?: number
  programId?: number
  isActive?: boolean
  sortBy?: 'name' | 'code' | 'created_at'
  sortDir?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export interface CourseFormData {
  code: string
  name: string
  description?: string
  credits: number
  departmentId?: number
  programId?: number
  isActive?: boolean
}

export interface CourseListResponse {
  courses: Course[]
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number | null
    to: number | null
  }
}

async function fetchCourses(filters: CourseFilters = {}): Promise<CourseListResponse> {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.departmentId) params.set('departmentId', String(filters.departmentId))
  if (filters.programId) params.set('programId', String(filters.programId))
  if (filters.isActive !== undefined) params.set('isActive', filters.isActive ? '1' : '0')
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortDir) params.set('sortDir', filters.sortDir)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.perPage) params.set('perPage', String(filters.perPage))

  const queryString = params.toString()
  const { data } = await api.get(`/admin/courses${queryString ? `?${queryString}` : ''}`)
  return data.data
}

async function fetchCourseFormMeta(): Promise<CourseFormMeta> {
  const { data } = await api.get('/admin/courses/form-meta')
  return data.data
}

async function createCourse(formData: CourseFormData): Promise<Course> {
  const payload: Record<string, unknown> = {
    code: formData.code,
    name: formData.name,
    description: formData.description || null,
    credits: formData.credits,
    departmentId: formData.departmentId || null,
    programId: formData.programId || null,
    isActive: formData.isActive ?? true,
  }

  const { data } = await api.post('/admin/courses', payload)
  return data.data
}

async function updateCourse({ id, formData }: { id: number; formData: CourseFormData }): Promise<Course> {
  const payload: Record<string, unknown> = {
    code: formData.code,
    name: formData.name,
    description: formData.description || null,
    credits: formData.credits,
    departmentId: formData.departmentId || null,
    programId: formData.programId || null,
    isActive: formData.isActive ?? true,
  }

  const { data } = await api.put(`/admin/courses/${id}`, payload)
  return data.data
}

async function toggleCourseActive(id: number): Promise<Course> {
  const { data } = await api.delete(`/admin/courses/${id}`)
  return data.data
}

const coursesQueryKey = (filters: CourseFilters) => ['admin', 'courses', filters]
const metaQueryKey = ['admin', 'courses', 'form-meta']

export function useCourses(filters: CourseFilters = {}) {
  const queryClient = useQueryClient()

  const coursesQuery = useQuery({
    queryKey: coursesQueryKey(filters),
    queryFn: () => fetchCourses(filters),
    staleTime: 30 * 1000,
  })

  const metaQuery = useQuery({
    queryKey: metaQueryKey,
    queryFn: fetchCourseFormMeta,
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] })
      toast.success('Course created')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create course')
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] })
      queryClient.setQueryData(['admin', 'courses', course.id], course)
      toast.success('Course updated')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update course')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: toggleCourseActive,
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] })
      queryClient.setQueryData(['admin', 'courses', course.id], course)
      toast.success(course.isActive ? 'Course activated' : 'Course deactivated')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update course status')
    },
  })

  return {
    courses: coursesQuery.data?.courses,
    pagination: coursesQuery.data?.pagination,
    isLoading: coursesQuery.isLoading,
    isFetching: coursesQuery.isFetching,
    meta: metaQuery.data,
    isMetaLoading: metaQuery.isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggleActive: toggleActiveMutation.mutateAsync,
    isTogglingActive: toggleActiveMutation.isPending,
  }
}
