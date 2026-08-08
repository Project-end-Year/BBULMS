import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'
import type { CourseOffering } from '@/hooks/useCourses'

export interface MyCoursesResponse {
  offerings: CourseOffering[]
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number | null
    to: number | null
  }
}

async function fetchMyCourses(semesterId?: number): Promise<MyCoursesResponse> {
  const params = new URLSearchParams()
  if (semesterId) params.set('semesterId', String(semesterId))

  const queryString = params.toString()
  const { data } = await api.get(`/my-courses${queryString ? `?${queryString}` : ''}`)
  return data.data
}

export function useMyCourses(semesterId?: number) {
  const query = useQuery({
    queryKey: ['my-courses', semesterId],
    queryFn: () => fetchMyCourses(semesterId),
    staleTime: 60 * 1000,
  })

  return {
    offerings: query.data?.offerings,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}
