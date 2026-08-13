
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface Faculty {
  id: number
  code: string
  name: string
  description?: string | null
  isActive: boolean
}

export interface FacultiesResponse {
  faculties: Faculty[]
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
  }
}

async function fetchFaculties(): Promise<Faculty[]> {
  const { data } = await api.get('/admin/faculties?perPage=100')
  return data.data.faculties as Faculty[]
}

export function useAdminFaculties() {
  const { data, isLoading, error } = useQuery<Faculty[], Error>({
    queryKey: ['admin', 'faculties'],
    queryFn: fetchFaculties,
    staleTime: 5 * 60 * 1000,
  })

  return { faculties: data, isLoading, error }
}
