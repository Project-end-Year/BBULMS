import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Search, Trash2, Users, Loader2, GraduationCap } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import {
  useEnrollments,
  useSearchStudents,
  useEnrollStudent,
  useDropStudent,
  useSelfEnroll,
  type SearchStudentResult,
  type EnrollmentItem,
} from '@/hooks/useEnrollments'
import type { CourseDetailSummary, CourseOfferingSummary } from '@/hooks/useCourseDetail'

interface CourseEnrollmentTabProps {
  data: CourseDetailSummary
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function CourseEnrollmentTab({ data }: CourseEnrollmentTabProps) {
  const { user } = useAuth()
  const { course, offerings, context } = data

  const isManager = context.role === 'admin' || context.role === 'lecturer'
  const isStudent = user?.roles.some((r) => r.name === 'student')

  const [selectedOffering, setSelectedOffering] = useState<CourseOfferingSummary | undefined>(
    offerings.find((o) => o.id === context.offeringId) ?? offerings[0]
  )

  const offeringId = selectedOffering?.id

  const { data: enrollmentData, isLoading } = useEnrollments(offeringId)
  const enroll = useEnrollStudent(offeringId)
  const drop = useDropStudent(offeringId)
  const selfEnroll = useSelfEnroll(isStudent ? offeringId : undefined)

  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<SearchStudentResult | null>(null)

  const { data: searchResults, isLoading: isSearching } = useSearchStudents(search)

  const enrollments = enrollmentData?.enrollments
  const capacity = enrollmentData?.capacity
  const enrolledCount = enrollmentData?.enrolledCount

  const handleEnroll = async (studentId?: number) => {
    try {
      await enroll.mutateAsync({ studentId })
      toast.success('Student enrolled successfully.')
      setSearch('')
      setSelectedStudent(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to enroll student.')
    }
  }

  const handleDrop = async (studentId: number, studentName: string) => {
    if (!window.confirm(`Drop ${studentName} from this offering?`)) return

    try {
      await drop.mutateAsync({ studentId })
      toast.success('Student dropped successfully.')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to drop student.')
    }
  }

  const remaining = capacity != null && capacity > 0 ? capacity - (enrolledCount ?? 0) : null
  const isFull = remaining != null && remaining <= 0

  const studentEnrollment = isStudent
    ? enrollments?.find((e) => e.student.id === user?.id)
    : undefined

  const isStudentEnrolled = studentEnrollment?.status === 'enrolled'

  return (
    <div className="space-y-6">
      {offerings.length > 1 && isManager && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-text">Section / Offering</label>
          <select
            value={selectedOffering?.id ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const id = Number(e.target.value)
              setSelectedOffering(offerings.find((o) => o.id === id))
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
          >
            {offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {offering.semester?.name || 'Unknown semester'}
                {offering.section ? ` · Section ${offering.section}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {isManager && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-bbu-blue" />
              <h3 className="text-lg font-semibold text-text">Enrollment</h3>
            </div>
            <div className="text-sm text-text-muted">
              {enrolledCount ?? 0} / {capacity ?? '∞'} enrolled
            </div>
          </div>

          {capacity != null && capacity > 0 && (
            <div className="mb-6">
              <div className="mb-1 flex justify-between text-xs text-text-muted">
                <span>Capacity</span>
                <span>
                  {enrolledCount ?? 0} / {capacity}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-bbu-blue"
                  style={{
                    width: `${Math.min(100, ((enrolledCount ?? 0) / capacity) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="relative mb-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSelectedStudent(null)
                  }}
                  placeholder="Search student by name, email or ID"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                />
              </div>
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => handleEnroll(selectedStudent.id)}
                  disabled={enroll.isPending || isFull}
                  className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {enroll.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Enroll {selectedStudent.name}
                </button>
              )}
            </div>

            {search.length >= 2 && !selectedStudent && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                {isSearching ? (
                  <div className="flex items-center justify-center p-4 text-text-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : searchResults?.length ? (
                  <ul className="max-h-60 overflow-auto py-1">
                    {searchResults.map((student) => (
                      <li key={student.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(student)
                            setSearch(student.name)
                          }}
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium text-text">{student.name}</p>
                            <p className="text-xs text-text-muted">{student.email}</p>
                          </div>
                          {student.studentId && (
                            <span className="text-xs text-text-muted">{student.studentId}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-text-muted">No students found.</p>
                )}
              </div>
            )}
          </div>

          {isFull && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              This offering is at full capacity. Drop a student before enrolling a new one.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-text-muted">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : enrollments?.length ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text">Student</th>
                    <th className="px-4 py-3 font-medium text-text">Enrolled on</th>
                    <th className="px-4 py-3 font-medium text-text">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-text">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrollments.map((enrollment: EnrollmentItem) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {enrollment.student.avatarUrl ? (
                            <img
                              src={enrollment.student.avatarUrl}
                              alt={enrollment.student.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bbu-blue text-xs font-medium text-white">
                              {enrollment.student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-text">{enrollment.student.name}</p>
                            <p className="text-xs text-text-muted">{enrollment.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(enrollment.enrolledAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            enrollment.status === 'enrolled'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDrop(enrollment.student.id, enrollment.student.name)}
                          disabled={drop.isPending}
                          className="inline-flex items-center gap-1 rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          aria-label="Drop student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-text-muted">No students enrolled yet.</div>
            )}
          </div>
        </div>
      )}

      {isStudent && !isManager && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-bbu-blue" />
            <h3 className="text-lg font-semibold text-text">Your Enrollment</h3>
          </div>

          {isStudentEnrolled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-medium">You are enrolled in {course.name}</span>
              </div>
              <p className="text-sm text-text-muted">
                Enrolled on {formatDate(studentEnrollment?.enrolledAt)}.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!user) return
                  handleDrop(user.id, user.name)
                }}
                disabled={drop.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {drop.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Drop this course
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-text-muted">You are not currently enrolled in this course offering.</p>

              {capacity != null && capacity > 0 && (
                <div className="mb-1 flex justify-between text-xs text-text-muted"
                >
                  <span>Capacity</span>
                  <span>
                    {enrolledCount ?? 0} / {capacity}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  try {
                    await selfEnroll.mutateAsync()
                    toast.success('You have joined the course.')
                  } catch (err: any) {
                    toast.error(err?.message || 'Failed to join the course.')
                  }
                }}
                disabled={selfEnroll.isPending || isFull || !offeringId}
                className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {selfEnroll.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {isFull ? 'Course is full' : 'Join this course'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CourseEnrollmentTab
