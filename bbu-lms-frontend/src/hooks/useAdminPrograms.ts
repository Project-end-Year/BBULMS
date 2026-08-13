
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'

export interface Program {
  id: number
  departmentId: number
  code: string
  name: string
  description?: string | null
  durationYears: number
  isActive: boolean
  department?: { id: number; code: string; name: string } | null
  coursesCount?: number
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ProgramFilters {
  search?: string
  departmentId?: number
  isActive?: boolean
  sortBy?: 'name' | 'code' | 'created_at'
  sortDir?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export interface ProgramFormData {
  departmentId: number
  code: string
  name: string
  description?: string
  durationYears?: number
  isActive?: boolean
}

export interface ProgramsResponse {
  programs: Program[]
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number | null
    to: number | null
  }
}

async function fetchPrograms(filters: ProgramFilters = {}): Promise<ProgramsResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.departmentId) params.set('departmentId', String(filters.departmentId))
  if (filters.isActive !== undefined) params.set('isActive', filters.isActive ? '1' : '0')
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortDir) params.set('sortDir', filters.sortDir)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.perPage) params.set('perPage', String(filters.perPage))

  const queryString = params.toString()
  const { data } = await api.get(`/admin/programs${queryString ? `?${queryString}` : ''}`)
  return data.data as ProgramsResponse
}

async function createProgram(formData: ProgramFormData): Promise<Program> {
  const payload: Record<string, unknown> = {
    departmentId: formData.departmentId,
    code: formData.code,
    name: formData.name,
    description: formData.description || null,
    durationYears: formData.durationYears ?? 4,
    isActive: formData.isActive ?? true,
  }
  const { data } = await api.post('/admin/programs', payload)
  return data.data as Program
}

async function updateProgram({ id, formData }: { id: number; formData: ProgramFormData }): Promise<Program> {
  const payload: Record<string, unknown> = {
    departmentId: formData.departmentId,
    code: formData.code,
    name: formData.name,
    description: formData.description || null,
    durationYears: formData.durationYears ?? 4,
    isActive: formData.isActive ?? true,
  }
  const { data } = await api.put(`/admin/programs/${id}`, payload)
  return data.data as Program
}

async function deleteProgram(id: number): Promise<void> {
  await api.delete(`/admin/programs/${id}`)
}

const programsQueryKey = (filters: ProgramFilters) => ['admin', 'programs', filters]

export function useAdminPrograms(filters: ProgramFilters = {}) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: programsQueryKey(filters),
    queryFn: () => fetchPrograms(filters),
    staleTime: 30 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] })
      toast.success('Program created')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to create program'),
  })

  const updateMutation = useMutation({
    mutationFn: updateProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] })
      toast.success('Program updated')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to update program'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] })
      toast.success('Program deleted')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to delete program'),
  })

  return {
    programs: listQuery.data?.programs,
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
