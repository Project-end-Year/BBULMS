
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface Counts {
  users: {
    total: number
    students: number
    lecturers: number
    admins: number
    active: number
    inactive: number
  }
  courses: number
  courseOfferings: number
  enrollments: {
    total: number
    active: number
    dropped: number
  }
  organizations: {
    departments: number
    programs: number
    semesters: number
  }
}

export interface RecentActivity {
  users: {
    id: number
    name: string
    email: string
    isActive: boolean
    createdAt: string
  }[]
  courses: {
    id: number
    code: string
    name: string
    departmentCode?: string | null
    createdAt: string
  }[]
  enrollments: {
    id: number
    studentName?: string | null
    courseCode?: string | null
    courseName?: string | null
    status: string
    createdAt: string
  }[]
}

export interface EnrollmentOverviewPoint {
  month: string
  label: string
  total: number
  active: number
  dropped: number
}

export interface SystemHealth {
  activeSemester: {
    id: number
    name: string
    startDate: string
    endDate: string
  } | null
  activeOfferingsThisSemester: number
  unassignedLecturers: number
}

export interface AdminDashboardData {
  counts: Counts
  recentActivity: RecentActivity
  enrollmentOverview: EnrollmentOverviewPoint[]
  systemHealth: SystemHealth
}

async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await api.get('/admin/dashboard')
  return data.data as AdminDashboardData
}

export function useAdminDashboard() {
  return useQuery<AdminDashboardData, Error>({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchAdminDashboard,
    staleTime: 60 * 1000,
  })
}

export async function downloadReport(type: 'users' | 'courses' | 'enrollments'): Promise<void> {
  const { data } = await api.get(`/admin/reports/${type}`, {
    responseType: 'blob',
  })
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${type}_${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
