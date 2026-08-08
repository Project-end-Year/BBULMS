import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'
import type { User } from '@/contexts/AuthContext'
import type { DepartmentOption, SemesterOption } from '@/hooks/useProfile'

export interface RoleOption {
  id: number
  name: string
  guardName: string
}

export interface UsersListResponse {
  users: User[]
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface UserFormMeta {
  departments: DepartmentOption[]
  roles: RoleOption[]
  semesters: SemesterOption[]
}

export interface UserFormData {
  name: string
  email: string
  phone?: string
  password?: string
  roles: string[]
  departmentId?: string
  locale?: string
  isActive?: boolean
  studentId?: string
  major?: string
  year?: string
  semesterId?: string
  title?: string
  officeHours?: unknown[]
}

export interface UsersFilter {
  search?: string
  role?: 'admin' | 'lecturer' | 'student'
  status?: 'active' | 'inactive'
  sortBy?: 'name' | 'email' | 'created_at'
  sortDir?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

async function fetchUsers(filters: UsersFilter = {}): Promise<UsersListResponse> {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.role) params.set('role', filters.role)
  if (filters.status) params.set('status', filters.status)
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortDir) params.set('sortDir', filters.sortDir)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.perPage) params.set('perPage', String(filters.perPage))

  const queryString = params.toString()
  const { data } = await api.get(`/admin/users${queryString ? `?${queryString}` : ''}`)
  return data.data
}

async function fetchUserFormMeta(): Promise<UserFormMeta> {
  const { data } = await api.get('/admin/users/form-meta')
  return data.data
}

async function createUser(formData: UserFormData): Promise<User> {
  const payload = buildUserPayload(formData)
  const { data } = await api.post('/admin/users', payload)
  return data.data
}

async function updateUser({ id, formData }: { id: number; formData: UserFormData }): Promise<User> {
  const payload = buildUserPayload(formData)
  const { data } = await api.put(`/admin/users/${id}`, payload)
  return data.data
}

async function toggleUserActive(id: number): Promise<User> {
  const { data } = await api.delete(`/admin/users/${id}`)
  return data.data
}

async function updateUserRoles({ id, roles }: { id: number; roles: string[] }): Promise<User> {
  const { data } = await api.put(`/admin/users/${id}/roles`, { roles })
  return data.data
}

function buildUserPayload(formData: UserFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone || null,
    roles: formData.roles,
    departmentId: formData.departmentId ? Number(formData.departmentId) : null,
    locale: formData.locale || 'en',
    isActive: formData.isActive ?? true,
  }

  if (formData.password) {
    payload.password = formData.password
  }

  if (formData.roles.includes('student')) {
    payload.studentId = formData.studentId || null
    payload.major = formData.major || null
    payload.year = formData.year ? Number(formData.year) : null
    payload.semesterId = formData.semesterId ? Number(formData.semesterId) : null
  }

  if (formData.roles.includes('lecturer')) {
    payload.title = formData.title || null
    payload.officeHours = formData.officeHours || null
  }

  return payload
}

const usersQueryKey = (filters: UsersFilter) => ['admin', 'users', filters]
const metaQueryKey = ['admin', 'users', 'form-meta']

export function useUsers(filters: UsersFilter = {}) {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: usersQueryKey(filters),
    queryFn: () => fetchUsers(filters),
    staleTime: 30 * 1000,
  })

  const metaQuery = useQuery({
    queryKey: metaQueryKey,
    queryFn: fetchUserFormMeta,
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User created')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create user')
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.setQueryData(['admin', 'users', user.id], user)
      toast.success('User updated')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: toggleUserActive,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.setQueryData(['admin', 'users', user.id], user)
      toast.success(user.isActive ? 'User activated' : 'User deactivated')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user status')
    },
  })

  const updateRolesMutation = useMutation({
    mutationFn: updateUserRoles,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.setQueryData(['admin', 'users', user.id], user)
      toast.success('Roles updated')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update roles')
    },
  })

  return {
    users: usersQuery.data?.users,
    pagination: usersQuery.data?.pagination,
    isLoading: usersQuery.isLoading,
    isFetching: usersQuery.isFetching,
    error: usersQuery.error,
    meta: metaQuery.data,
    isMetaLoading: metaQuery.isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggleActive: toggleActiveMutation.mutateAsync,
    isTogglingActive: toggleActiveMutation.isPending,
    updateRoles: updateRolesMutation.mutateAsync,
    isUpdatingRoles: updateRolesMutation.isPending,
  }
}
