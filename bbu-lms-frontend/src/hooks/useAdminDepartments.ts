
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'

export interface Department {
  id: number
  facultyId: number
  code: string
  name: string
  description?: string | null
  isActive: boolean
  faculty?: { id: number; code: string; name: string } | null
  programsCount?: number
  usersCount?: number
  coursesCount?: number
  createdAt?: string | null
  updatedAt?: string | null
}

export interface DepartmentFilters {
  search?: string
  facultyId?: number
  isActive?: boolean
  sortBy?: 'name' | 'code' | 'created_at'
  sortDir?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export interface DepartmentFormData {
  facultyId: number
  code: string
  name: string
  description?: string
  isActive?: boolean
}

export interface DepartmentsResponse {
  departments: Department[]
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number | null
    to: number | null
  }
}

async function fetchDepartments(filters: DepartmentFilters = {}): Promise<DepartmentsResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.facultyId) params.set('facultyId', String(filters.facultyId))
  if (filters.isActive !== undefined) params.set('isActive', filters.isActive ? '1' : '0')
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortDir) params.set('sortDir', filters.sortDir)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.perPage) params.set('perPage', String(filters.perPage))

  const queryString = params.toString()
  const { data } = await api.get(`/admin/departments${queryString ? `?${queryString}` : ''}`)
  return data.data as DepartmentsResponse
}

async function createDepartment(formData: DepartmentFormData): Promise<Department> {
  const payload: Record<string, unknown> = {
    facultyId: formData.facultyId,
    code: formData.code,
    name: formData.name,
    description: formData.description || null,
    isActive: formData.isActive ?? true,
  }
  const { data } = await api.post('/admin/departments', payload)
  return data.data as Department
}

async function updateDepartment({ id, formData }: { id: number; formData: DepartmentFormData }): Promise<Department> {
  const payload: Record<string, unknown> = {
    facultyId: formData.facultyId,
    code: formData.code,
    name: formData.name,
    description: formData.description || null,
    isActive: formData.isActive ?? true,
  }
  const { data } = await api.put(`/admin/departments/${id}`, payload)
  return data.data as Department
}

async function deleteDepartment(id: number): Promise<void> {
  await api.delete(`/admin/departments/${id}`)
}

const departmentsQueryKey = (filters: DepartmentFilters) => ['admin', 'departments', filters]

export function useAdminDepartments(filters: DepartmentFilters = {}) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: departmentsQueryKey(filters),
    queryFn: () => fetchDepartments(filters),
    staleTime: 30 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'faculties'] })
      toast.success('Department created')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to create department'),
  })

  const updateMutation = useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
      toast.success('Department updated')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to update department'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
      toast.success('Department deleted')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to delete department'),
  })

  return {
    departments: listQuery.data?.departments,
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
