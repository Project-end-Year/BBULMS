
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'

export interface Semester {
  id: number
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  courseOfferingsCount?: number
  createdAt?: string | null
  updatedAt?: string | null
}

export interface SemesterFilters {
  search?: string
  isActive?: boolean
  sortBy?: 'name' | 'start_date' | 'created_at'
  sortDir?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export interface SemesterFormData {
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface SemestersResponse {
  semesters: Semester[]
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number | null
    to: number | null
  }
}

async function fetchSemesters(filters: SemesterFilters = {}): Promise<SemestersResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.isActive !== undefined) params.set('isActive', filters.isActive ? '1' : '0')
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortDir) params.set('sortDir', filters.sortDir)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.perPage) params.set('perPage', String(filters.perPage))

  const queryString = params.toString()
  const { data } = await api.get(`/admin/semesters${queryString ? `?${queryString}` : ''}`)
  return data.data as SemestersResponse
}

async function createSemester(formData: SemesterFormData): Promise<Semester> {
  const payload: Record<string, unknown> = {
    name: formData.name,
    startDate: formData.startDate,
    endDate: formData.endDate,
    isActive: formData.isActive ?? true,
  }
  const { data } = await api.post('/admin/semesters', payload)
  return data.data as Semester
}

async function updateSemester({ id, formData }: { id: number; formData: SemesterFormData }): Promise<Semester> {
  const payload: Record<string, unknown> = {
    name: formData.name,
    startDate: formData.startDate,
    endDate: formData.endDate,
    isActive: formData.isActive ?? true,
  }
  const { data } = await api.put(`/admin/semesters/${id}`, payload)
  return data.data as Semester
}

async function deleteSemester(id: number): Promise<void> {
  await api.delete(`/admin/semesters/${id}`)
}

const semestersQueryKey = (filters: SemesterFilters) => ['admin', 'semesters', filters]

export function useAdminSemesters(filters: SemesterFilters = {}) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: semestersQueryKey(filters),
    queryFn: () => fetchSemesters(filters),
    staleTime: 30 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'semesters'] })
      toast.success('Semester created')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to create semester'),
  })

  const updateMutation = useMutation({
    mutationFn: updateSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'semesters'] })
      toast.success('Semester updated')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to update semester'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'semesters'] })
      toast.success('Semester deleted')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to delete semester'),
  })

  return {
    semesters: listQuery.data?.semesters,
    pagination: listQuery.data?.pagination,
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
