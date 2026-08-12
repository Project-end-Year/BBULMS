import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface HistoryCourse {
  offeringId: number
  courseCode: string
  courseName: string
  credits: number
  percentage: number | null
  letterGrade: string | null
  gpaPoints: number | null
  qualityPoints: number | null
}

export interface SemesterSummary {
  semesterId: number
  semesterName: string
  startDate: string | null
  endDate: string | null
  courses: HistoryCourse[]
  totalCredits: number
  gpa: number | null
}

export interface GradeHistoryResponse {
  semesters: SemesterSummary[]
  cumulativeCredits: number
  cumulativeGpa: number | null
}

export interface GradeSummaryResponse {
  semesterId: number | null
  semesterName: string
  courses: HistoryCourse[]
  totalCredits: number
  gpa: number | null
  cumulativeCredits: number
  cumulativeGpa: number | null
}

async function fetchGradeHistory(semesterId?: number): Promise<GradeHistoryResponse> {
  const params = new URLSearchParams()
  if (semesterId) params.set('semesterId', String(semesterId))

  const queryString = params.toString()
  const { data } = await api.get(`/grade-history${queryString ? `?${queryString}` : ''}`)
  return data.data as GradeHistoryResponse
}

async function fetchGradeSummary(semesterId?: number): Promise<GradeSummaryResponse> {
  const params = new URLSearchParams()
  if (semesterId) params.set('semesterId', String(semesterId))

  const queryString = params.toString()
  const { data } = await api.get(`/grade-history/summary${queryString ? `?${queryString}` : ''}`)
  return data.data as GradeSummaryResponse
}

export function useGradeHistory(semesterId?: number) {
  return useQuery<GradeHistoryResponse, Error>({
    queryKey: ['grade-history', semesterId],
    queryFn: () => fetchGradeHistory(semesterId),
    staleTime: 60 * 1000,
  })
}

export function useGradeSummary(semesterId?: number) {
  return useQuery<GradeSummaryResponse, Error>({
    queryKey: ['grade-summary', semesterId],
    queryFn: () => fetchGradeSummary(semesterId),
    staleTime: 60 * 1000,
  })
}
