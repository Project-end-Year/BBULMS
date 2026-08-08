import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export interface CourseSummary {
  id: number
  code: string
  name: string
  description: string | null
  credits: number
  isActive: boolean
  department: { id: number; code: string; name: string } | null
  program: { id: number; code: string; name: string } | null
  createdAt: string | null
  updatedAt: string | null
}

export interface Schedule {
  days?: string[]
  start?: string
  end?: string
}

export interface CourseOfferingSummary {
  id: number
  semester: { id: number; name: string } | null
  lecturer: { id: number; name: string; email: string } | null
  capacity: number
  section: string | null
  room: string | null
  schedule: Schedule | null
  enrollmentCount: number | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface ClassScheduleItem {
  id: number
  courseOfferingId: number
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string | null
  type: string
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface CourseContext {
  role: 'admin' | 'lecturer' | 'student' | 'none'
  offeringId?: number
}

export interface CourseDetailSummary {
  course: CourseSummary
  offerings: CourseOfferingSummary[]
  classSchedules: ClassScheduleItem[]
  context: CourseContext
}

export function useCourseDetail(courseId: string | undefined) {
  return useQuery<CourseDetailSummary, Error>({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/summary`)
      return data.data as CourseDetailSummary
    },
    enabled: !!courseId,
  })
}
