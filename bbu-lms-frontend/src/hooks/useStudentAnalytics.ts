import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface GradeTrendPoint {
  semesterId: number
  semesterName: string
  averagePercentage: number
}

export interface AttendanceTrendPoint {
  month: string
  label: string
  rate: number
  present: number
  late: number
  absent: number
  total: number
}

export interface CompletionRate {
  rate: number | null
  completedCount: number
  totalCount: number
}

export interface AtRiskCourse {
  offeringId: number
  courseCode: string | null
  courseName: string | null
  overallPercentage?: number
  attendanceRate?: number
}

export interface AtRiskFlag {
  isAtRisk: boolean
  reasons: string[]
  lowGradeCourses: AtRiskCourse[]
  lowAttendanceCourses: AtRiskCourse[]
}

export interface CourseSnapshot {
  offeringId: number
  courseId: number
  courseCode: string | null
  courseName: string | null
  semesterId: number
  semesterName: string
  overallPercentage: number | null
  letterGrade: string | null
  attendanceRate: number | null
  presentCount: number
  lateCount: number
  absentCount: number
  totalSessions: number
  assignmentCompletionRate: number | null
  completedAssignments: number
  totalAssignments: number
}

export interface StudentAnalyticsData {
  gradeTrend: GradeTrendPoint[]
  attendanceTrend: AttendanceTrendPoint[]
  assignmentCompletionRate: CompletionRate
  atRiskFlag: AtRiskFlag
  courseSnapshots: CourseSnapshot[]
}

async function fetchStudentAnalytics(): Promise<StudentAnalyticsData> {
  const { data } = await api.get('/analytics/student')
  return data.data as StudentAnalyticsData
}

export function useStudentAnalytics() {
  return useQuery<StudentAnalyticsData, Error>({
    queryKey: ['student-analytics'],
    queryFn: fetchStudentAnalytics,
    staleTime: 60 * 1000,
  })
}
