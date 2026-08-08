import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'
import type { User } from '@/contexts/AuthContext'

export interface DepartmentOption {
  id: number
  code: string
  name: string
}

export interface SemesterOption {
  id: number
  name: string
}

export interface ProfileData {
  user: User
  departments: DepartmentOption[]
  semesters: SemesterOption[]
}

export interface ProfileFormData {
  name: string
  phone?: string
  locale: string
  studentId?: string
  departmentId?: string
  major?: string
  year?: string
  semesterId?: string
  title?: string
  officeHours?: unknown[]
}

async function fetchProfile(): Promise<ProfileData> {
  const { data } = await api.get('/profile')
  return data.data
}

async function updateProfile(formData: ProfileFormData): Promise<User> {
  const payload: Record<string, unknown> = {
    name: formData.name,
    phone: formData.phone || null,
    locale: formData.locale,
  }

  if (formData.studentId !== undefined) {
    payload.studentId = formData.studentId
    payload.departmentId = formData.departmentId ? Number(formData.departmentId) : null
    payload.major = formData.major || null
    payload.year = formData.year ? Number(formData.year) : null
    payload.semesterId = formData.semesterId ? Number(formData.semesterId) : null
  }

  if (formData.title !== undefined) {
    payload.departmentId = formData.departmentId ? Number(formData.departmentId) : null
    payload.title = formData.title || null
    payload.officeHours = formData.officeHours || null
  }

  const { data } = await api.put('/profile', payload)
  return data.data
}

export function useProfile() {
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(['profile'], (old: ProfileData | undefined) =>
        old ? { ...old, user } : old
      )
      queryClient.setQueryData(['user'], user)
      toast.success('Profile saved')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to save profile')
    },
  })

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
