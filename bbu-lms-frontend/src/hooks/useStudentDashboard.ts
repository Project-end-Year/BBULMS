import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface DashboardClass {
  id: number
  courseCode: string | null
  courseName: string | null
  room: string | null
  startTime: string | null
  endTime: string | null
  type: string | null
  offeringId: number | null
}

export interface DashboardAssignment {
  id: number
  title: string
  dueAt: string
  courseCode: string | null
  courseName: string | null
  isSubmitted: boolean
  offeringId: number | null
}

export interface DashboardGrade {
  id: number
  componentName: string | null
  courseCode: string | null
  courseName: string | null
  percentage: number | null
  letterGrade: string | null
  updatedAt: string
  offeringId: number | null
}

export interface DashboardExam {
  id: number
  title: string
  startsAt: string
  endsAt: string | null
  courseCode: string | null
  courseName: string | null
  offeringId: number | null
}

export interface StudentDashboardData {
  todaysClasses: DashboardClass[]
  upcomingAssignments: DashboardAssignment[]
  attendancePercentage: number | null
  recentGrades: DashboardGrade[]
  upcomingExams: DashboardExam[]
  unreadMessages: number
}

async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const { data } = await api.get('/dashboard/student')
  return data.data as StudentDashboardData
}

export function useStudentDashboard() {
  return useQuery<StudentDashboardData, Error>({
    queryKey: ['student-dashboard'],
    queryFn: fetchStudentDashboard,
    staleTime: 60 * 1000,
  })
}
