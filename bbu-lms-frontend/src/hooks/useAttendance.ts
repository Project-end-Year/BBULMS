import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'

export interface AttendanceRecord {
  id: number
  attendanceSessionId: number
  student: { id: number; name: string; email: string } | null
  status: AttendanceStatus
  checkedInAt: string | null
  latitude: string | null
  longitude: string | null
  checkInMethod: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface AttendanceSession {
  id: number
  courseOfferingId: number
  lecturer: { id: number; name: string; email: string } | null
  title: string | null
  startsAt: string
  endsAt: string | null
  code: string
  qrToken: string
  isActive: boolean
  lateThresholdMinutes: number
  closedAt: string | null
  records: AttendanceRecord[]
  presentCount: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface AttendanceHistoryData {
  sessions: AttendanceSession[]
  records: AttendanceRecord[]
  summary?: {
    total: number
    present: number
    late: number
    absent: number
    excused: number
    percentage: number
  }
}

export interface SessionFormData {
  title?: string
  startsAt: string
  endsAt?: string
  lateThresholdMinutes?: number
  isActive?: boolean
}

export interface CheckInFormData {
  token?: string
  code?: string
  latitude?: number
  longitude?: number
}

const sessionsKey = (offeringId: number | undefined) => ['attendance-sessions', offeringId]
const sessionKey = (offeringId: number | undefined, sessionId: number | undefined) => [
  'attendance-session',
  offeringId,
  sessionId,
]
const recordsKey = (offeringId: number | undefined, sessionId: number | undefined) => [
  'attendance-records',
  offeringId,
  sessionId,
]
const historyKey = (offeringId: number | undefined) => ['attendance-history', offeringId]

export function useAttendanceSessions(offeringId: number | undefined) {
  return useQuery<{ sessions: AttendanceSession[] }, Error>({
    queryKey: sessionsKey(offeringId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/attendance-sessions`)
      return data.data as { sessions: AttendanceSession[] }
    },
    enabled: !!offeringId,
  })
}

export function useAttendanceSession(offeringId: number | undefined, sessionId: number | undefined) {
  return useQuery<{ session: AttendanceSession }, Error>({
    queryKey: sessionKey(offeringId, sessionId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/attendance-sessions/${sessionId}`)
      return data.data as { session: AttendanceSession }
    },
    enabled: !!offeringId && !!sessionId,
  })
}

export function useCreateAttendanceSession(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<AttendanceSession, Error, SessionFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post(`/course-offerings/${offeringId}/attendance-sessions`, formData)
      return data.data.session as AttendanceSession
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: historyKey(offeringId) })
      toast.success('Attendance session created.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create session.')
    },
  })
}

export function useUpdateAttendanceSession(offeringId: number | undefined, sessionId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<AttendanceSession, Error, Partial<SessionFormData>>({
    mutationFn: async (formData) => {
      const { data } = await api.put(`/course-offerings/${offeringId}/attendance-sessions/${sessionId}`, formData)
      return data.data.session as AttendanceSession
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: sessionKey(offeringId, sessionId) })
      queryClient.invalidateQueries({ queryKey: historyKey(offeringId) })
      toast.success('Attendance session updated.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update session.')
    },
  })
}

export function useDeleteAttendanceSession(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (sessionId) => {
      await api.delete(`/course-offerings/${offeringId}/attendance-sessions/${sessionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: historyKey(offeringId) })
      toast.success('Attendance session deleted.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete session.')
    },
  })
}

export function useAttendanceRecords(offeringId: number | undefined, sessionId: number | undefined) {
  return useQuery<{ records: AttendanceRecord[] }, Error>({
    queryKey: recordsKey(offeringId, sessionId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/attendance-sessions/${sessionId}/records`)
      return data.data as { records: AttendanceRecord[] }
    },
    enabled: !!offeringId && !!sessionId,
  })
}

export function useMyAttendanceRecord(offeringId: number | undefined, sessionId: number | undefined) {
  return useQuery<{ record: AttendanceRecord | null }, Error>({
    queryKey: ['my-attendance-record', offeringId, sessionId],
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/attendance-sessions/${sessionId}/my-record`)
      return data.data as { record: AttendanceRecord | null }
    },
    enabled: !!offeringId && !!sessionId,
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()

  return useMutation<AttendanceRecord, Error, CheckInFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post('/attendance/check-in', formData)
      return data.data.record as AttendanceRecord
    },
    onSuccess: (record) => {
      if (record.attendanceSessionId) {
        queryClient.invalidateQueries({ queryKey: ['my-attendance-record', undefined, record.attendanceSessionId] })
        queryClient.invalidateQueries({ queryKey: ['attendance-records', undefined, record.attendanceSessionId] })
        queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] })
        queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
      }
      toast.success('Check-in recorded.')
    },
    onError: (error) => {
      toast.error(error.message || 'Check-in failed.')
    },
  })
}

export function useUpdateAttendanceRecord(
  offeringId: number | undefined,
  sessionId: number | undefined,
  recordId: number | undefined
) {
  const queryClient = useQueryClient()

  return useMutation<AttendanceRecord, Error, { status: AttendanceStatus; feedback?: string }>({
    mutationFn: async (formData) => {
      const { data } = await api.put(
        `/course-offerings/${offeringId}/attendance-sessions/${sessionId}/records/${recordId}`,
        formData
      )
      return data.data.record as AttendanceRecord
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recordsKey(offeringId, sessionId) })
      queryClient.invalidateQueries({ queryKey: sessionsKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: historyKey(offeringId) })
      toast.success('Attendance record updated.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update record.')
    },
  })
}

export function useAttendanceHistory(offeringId: number | undefined) {
  return useQuery<AttendanceHistoryData, Error>({
    queryKey: historyKey(offeringId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/attendance-history`)
      return data.data as AttendanceHistoryData
    },
    enabled: !!offeringId,
  })
}

export function useQrSvgUrl(offeringId: number | undefined, sessionId: number | undefined) {
  return offeringId && sessionId
    ? `${api.defaults.baseURL}/course-offerings/${offeringId}/attendance-sessions/${sessionId}/qr`
    : null
}

export function formatSessionTime(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-700'
    case 'late':
      return 'bg-amber-100 text-amber-700'
    case 'excused':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-red-100 text-red-700'
  }
}
