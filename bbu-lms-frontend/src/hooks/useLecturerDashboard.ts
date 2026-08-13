import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface LecturerDashboardClass {
  id: number
  courseCode: string | null
  courseName: string | null
  room: string | null
  startTime: string | null
  endTime: string | null
  type: string | null
  offeringId: number | null
}

export interface ActiveAttendanceSession {
  id: number
  title: string | null
  courseCode: string | null
  courseName: string | null
  startsAt: string
  endsAt: string | null
  offeringId: number | null
}

export interface DashboardAssignment {
  id: number
  title: string
  dueAt: string
  courseCode: string | null
  courseName: string | null
  submissionCount: number
  offeringId: number | null
}

export interface LowPerformer {
  studentId: number
  studentName: string
  courseCode: string | null
  courseName: string | null
  percentage: number
  offeringId: number
}

export interface CourseAverage {
  offeringId: number
  courseCode: string | null
  courseName: string | null
  averagePercentage: number
  studentCount: number
}

export interface LecturerDashboardData {
  todaysClasses: LecturerDashboardClass[]
  pendingGradingCount: number
  attendanceStatus: {
    activeSessions: ActiveAttendanceSession[]
    totalStudents: number
    checkedInCount: number
  }
  upcomingAssignments: DashboardAssignment[]
  studentPerformance: {
    lowPerformers: LowPerformer[]
    courseAverages: CourseAverage[]
  }
}

async function fetchLecturerDashboard(): Promise<LecturerDashboardData> {
  const { data } = await api.get('/dashboard/lecturer')
  return data.data as LecturerDashboardData
}

export function useLecturerDashboard() {
  return useQuery<LecturerDashboardData, Error>({
    queryKey: ['lecturer-dashboard'],
    queryFn: fetchLecturerDashboard,
    staleTime: 60 * 1000,
  })
}
