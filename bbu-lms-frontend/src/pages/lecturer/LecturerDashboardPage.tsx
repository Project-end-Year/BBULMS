import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  GraduationCap,
  Clock,
  MapPin,
  FileText,
  Users,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { useAuth } from '@/contexts/AuthContext'
import { useMyCourses } from '@/hooks/useMyCourses'
import { useLecturerDashboard, type LecturerDashboardClass, type ActiveAttendanceSession, type DashboardAssignment, type LowPerformer, type CourseAverage } from '@/hooks/useLecturerDashboard'
import { StatCard, EmptyState, SectionHeader } from '@/pages/shared/dashboard/DashboardShared'
import { formatDueLabel } from '@/pages/shared/dashboard/dashboardUtils'

function TodaysClasses({ classes }: { classes: LecturerDashboardClass[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={GraduationCap} title="Today's Classes" to="/courses" />
      {classes.length === 0 ? (
        <EmptyState message="No classes scheduled for today." />
      ) : (
        <div className="space-y-3">
          {classes.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">
                  {session.courseCode} · {session.courseName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {session.startTime?.slice(0, 5)} – {session.endTime?.slice(0, 5)}
                  </span>
                  {session.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {session.room}
                    </span>
                  )}
                  {session.type && <span className="capitalize">{session.type}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PendingGradingCard({ count }: { count: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Pending Grading</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-200">
          <span className="text-lg font-bold text-amber-700">{count}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text">Items waiting for review</p>
          <p className="text-xs text-text-muted">Assignments + short-answer quizzes</p>
        </div>
      </div>
    </div>
  )
}

function AttendanceStatusCard({ status }: { status: { activeSessions: ActiveAttendanceSession[]; totalStudents: number; checkedInCount: number } }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={Users} title="Attendance Status" to="/courses" />
      {status.activeSessions.length === 0 ? (
        <EmptyState message="No active attendance sessions right now." />
      ) : (
        <div className="space-y-3">
          {status.activeSessions.map((session) => (
            <div key={session.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-sm font-medium text-text">{session.title ?? 'Attendance session'}</p>
              <p className="text-xs text-text-muted">
                {session.courseCode} · {session.courseName}
              </p>
              <p className="mt-1 text-xs font-medium text-bbu-blue">
                {format(parseISO(session.startsAt), 'h:mm a')} –{' '}
                {session.endsAt ? format(parseISO(session.endsAt), 'h:mm a') : 'Open'}
              </p>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-bbu-blue/5 p-3">
            <span className="text-xs text-text-muted">Checked in</span>
            <span className="text-sm font-bold text-bbu-blue">
              {status.checkedInCount} / {status.totalStudents}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function UpcomingAssignments({ assignments }: { assignments: DashboardAssignment[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={ClipboardList} title="Upcoming Assignments" to="/courses" />
      {assignments.length === 0 ? (
        <EmptyState message="No assignments due in the next two weeks." />
      ) : (
        <div className="space-y-3">
          {assignments.slice(0, 5).map((assignment) => (
            <div key={assignment.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-sm font-medium text-text">{assignment.title}</p>
              <p className="text-xs text-text-muted">
                {assignment.courseCode} · {assignment.courseName}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs font-medium text-amber-600">{formatDueLabel(assignment.dueAt)}</p>
                <p className="text-xs text-text-muted">{assignment.submissionCount} submissions</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentPerformance({ performance }: { performance: { lowPerformers: LowPerformer[]; courseAverages: CourseAverage[] } }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Student Performance</h3>
      </div>

      {performance.courseAverages.length === 0 && performance.lowPerformers.length === 0 ? (
        <EmptyState message="No grade data available yet." />
      ) : (
        <div className="space-y-5">
          {performance.courseAverages.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Course averages</p>
              <div className="space-y-2">
                {performance.courseAverages.map((course) => (
                  <div key={course.offeringId} className="flex items-center justify-between rounded-lg bg-gray-50/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {course.courseCode} · {course.courseName}
                      </p>
                      <p className="text-xs text-text-muted">{course.studentCount} students</p>
                    </div>
                    <span className="text-sm font-bold text-bbu-blue">{course.averagePercentage.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {performance.lowPerformers.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <AlertTriangle className="h-3.5 w-3.5" />
                At-risk students (&lt; 60%)
              </p>
              <div className="space-y-2">
                {performance.lowPerformers.slice(0, 5).map((student) => (
                  <div
                    key={`${student.studentId}-${student.offeringId}`}
                    className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-text">{student.studentName}</p>
                      <p className="text-xs text-text-muted">
                        {student.courseCode} · {student.courseName}
                      </p>
                    </div>
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      {student.percentage.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LecturerDashboardPage() {
  const { user } = useAuth()
  const { offerings, isLoading: coursesLoading } = useMyCourses()
  const { data: lecturerDashboard, isLoading: lecturerDashboardLoading } = useLecturerDashboard()

  const courseCount = offerings?.length ?? 0
  const welcomeName = user?.name?.split(' ')[0] ?? 'there'
  const pendingGrading = lecturerDashboard?.pendingGradingCount ?? 0
  const upcomingAssignments = lecturerDashboard?.upcomingAssignments ?? []

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <LayoutDashboard className="h-7 w-7 text-bbu-blue" />
        <div>
          <h1 className="text-2xl font-semibold text-text">Lecturer Dashboard</h1>
          <p className="text-sm text-text-muted">Welcome back, {welcomeName}.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses" value={coursesLoading ? '-' : courseCount} icon={BookOpen} to="/courses" tone="blue" />
        <StatCard
          label="Pending Grading"
          value={lecturerDashboardLoading ? '-' : pendingGrading}
          icon={ClipboardList}
          to="/courses"
          tone={pendingGrading > 0 ? 'red' : 'green'}
        />
        <StatCard label="Upcoming Exams" value="-" icon={CalendarDays} to="/calendar" tone="red" />
        <StatCard label="Unread Messages" value="-" icon={MessageSquare} to="/chat" tone="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <TodaysClasses classes={lecturerDashboard?.todaysClasses ?? []} />
            <PendingGradingCard count={pendingGrading} />
          </div>
          <AttendanceStatusCard
            status={lecturerDashboard?.attendanceStatus ?? { activeSessions: [], totalStudents: 0, checkedInCount: 0 }}
          />
          <StudentPerformance
            performance={lecturerDashboard?.studentPerformance ?? { lowPerformers: [], courseAverages: [] }}
          />
        </div>
        <div className="space-y-6">
          <UpcomingAssignments assignments={upcomingAssignments} />
        </div>
      </div>
    </div>
  )
}

export default LecturerDashboardPage
